import os
import json
import shutil
import argparse
from pathlib import Path
from typing import List, Dict, Tuple

import pandas as pd
import torch
from PIL import Image, UnidentifiedImageError
from transformers import CLIPProcessor, CLIPModel


# =========================
# 1. 場景設定
# =========================

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

SCENE_LABELS = [
    "entryway",
    "living room",
    "dining room",
    "kitchen",
    "bedroom",
    "bathroom",
    "balcony",
    "hallway",
    "study room",
    "laundry area",
    "staircase",
    "empty room",
    "other indoor room",
]

LABEL_TO_ZH = {
    "entryway": "玄關",
    "living room": "客廳",
    "dining room": "餐廳",
    "kitchen": "廚房",
    "bedroom": "臥室",
    "bathroom": "浴室",
    "balcony": "陽台",
    "hallway": "走廊",
    "study room": "書房",
    "laundry area": "洗衣區",
    "staircase": "樓梯",
    "empty room": "空房間",
    "other indoor room": "其他室內空間",
}

# 你要的排序順序
SCENE_SORT_ORDER = {
    "玄關": 1,
    "客廳": 2,
    "餐廳": 3,
    "廚房": 4,
    "書房": 5,
    "臥室": 6,
    "浴室": 7,
    "洗衣區": 8,
    "陽台": 9,
    "走廊": 10,
    "樓梯": 11,
    "空房間": 12,
    "其他室內空間": 99,
    "待確認": 999,
}


# =========================
# 2. 工具函式
# =========================

def load_image_paths(image_dir: str) -> List[Path]:
    folder = Path(image_dir)
    if not folder.exists():
        raise FileNotFoundError(f"找不到資料夾: {image_dir}")
    if not folder.is_dir():
        raise NotADirectoryError(f"不是資料夾: {image_dir}")

    image_paths = [
        p for p in folder.iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
    ]
    return sorted(image_paths, key=lambda x: x.name.lower())


def build_prompts(labels: List[str]) -> List[str]:
    prompt_map = {
        "entryway": "a photo of a home entryway or foyer",
        "living room": "a photo of a living room with sofa and TV area",
        "dining room": "a photo of a dining room with dining table and chairs",
        "kitchen": "a photo of a kitchen with stove, sink, cabinets, or refrigerator",
        "bedroom": "a photo of a bedroom with a bed and wardrobe",
        "bathroom": "a photo of a bathroom with toilet, sink, shower, or bathtub",
        "balcony": "a photo of a balcony or veranda in a home",
        "hallway": "a photo of a hallway or corridor inside a home",
        "study room": "a photo of a study room or home office",
        "laundry area": "a photo of a laundry area with a washing machine",
        "staircase": "a photo of an indoor staircase",
        "empty room": "a photo of an empty room in a house",
        "other indoor room": "a photo of another indoor room in a house",
    }
    return [prompt_map[label] for label in labels]


def softmax(logits: torch.Tensor) -> torch.Tensor:
    exp_logits = torch.exp(logits - torch.max(logits))
    return exp_logits / exp_logits.sum(dim=-1, keepdim=True)


def apply_simple_rules(
    top3_labels_en: List[str],
    top3_scores: List[float],
    low_conf_threshold: float = 0.35,
) -> Tuple[str, float, str]:
    """
    依 top3 結果做一些簡單規則修正。
    回傳:
      final_label_en, final_score, note
    """
    top1_label = top3_labels_en[0]
    top1_score = top3_scores[0]
    note = ""

    # 規則 1：低信心直接標待確認
    if top1_score < low_conf_threshold:
        return "待確認", float(top1_score), "信心偏低，建議人工確認"

    # 規則 2：客廳/餐廳分數接近，視為混合空間傾向
    if "living room" in top3_labels_en and "dining room" in top3_labels_en:
        living_idx = top3_labels_en.index("living room")
        dining_idx = top3_labels_en.index("dining room")
        diff = abs(top3_scores[living_idx] - top3_scores[dining_idx])
        if diff < 0.06:
            winner = (
                "living room"
                if top3_scores[living_idx] >= top3_scores[dining_idx]
                else "dining room"
            )
            return winner, float(max(top3_scores[living_idx], top3_scores[dining_idx])), "可能為餐客廳混合空間"

    # 規則 3：前兩名非常接近
    if len(top3_scores) >= 2 and abs(top3_scores[0] - top3_scores[1]) < 0.04:
        note = "前兩名分數接近，建議人工複核"

    return top1_label, float(top1_score), note


def zh_label_from_en(en_label: str) -> str:
    if en_label == "待確認":
        return "待確認"
    return LABEL_TO_ZH.get(en_label, en_label)


def classify_image(
    image_path: Path,
    model: CLIPModel,
    processor: CLIPProcessor,
    device: str,
    low_conf_threshold: float,
) -> Dict:
    image = Image.open(image_path).convert("RGB")
    prompts = build_prompts(SCENE_LABELS)

    inputs = processor(
        text=prompts,
        images=image,
        return_tensors="pt",
        padding=True
    ).to(device)

    with torch.no_grad():
        outputs = model(**inputs)
        logits_per_image = outputs.logits_per_image[0]
        probs = softmax(logits_per_image).cpu().numpy()

    ranked = sorted(
        zip(SCENE_LABELS, probs),
        key=lambda x: x[1],
        reverse=True
    )

    top3 = ranked[:3]
    top3_labels_en = [x[0] for x in top3]
    top3_scores = [float(x[1]) for x in top3]

    final_label_en, final_score, note = apply_simple_rules(
        top3_labels_en,
        top3_scores,
        low_conf_threshold=low_conf_threshold,
    )

    final_label_zh = zh_label_from_en(final_label_en)
    sort_order = SCENE_SORT_ORDER.get(final_label_zh, 999)

    return {
        "file_name": image_path.name,
        "file_path": str(image_path.resolve()),
        "scene_en": final_label_en,
        "scene_zh": final_label_zh,
        "confidence": round(final_score, 4),
        "sort_order": sort_order,
        "note": note,
        "top3_predictions": [
            {
                "label_en": label_en,
                "label_zh": zh_label_from_en(label_en),
                "score": round(float(score), 4),
            }
            for label_en, score in top3
        ],
    }


def save_results(results: List[Dict], output_csv: str, output_json: str) -> None:
    df = pd.DataFrame([
        {
            "file_name": r["file_name"],
            "file_path": r["file_path"],
            "scene_zh": r["scene_zh"],
            "scene_en": r["scene_en"],
            "confidence": r["confidence"],
            "sort_order": r["sort_order"],
            "note": r["note"],
            "top1": f'{r["top3_predictions"][0]["label_zh"]} ({r["top3_predictions"][0]["score"]})',
            "top2": f'{r["top3_predictions"][1]["label_zh"]} ({r["top3_predictions"][1]["score"]})',
            "top3": f'{r["top3_predictions"][2]["label_zh"]} ({r["top3_predictions"][2]["score"]})',
            "new_name": r.get("new_name", ""),
            "new_path": r.get("new_path", ""),
        }
        for r in results
    ])

    df = df.sort_values(
        by=["sort_order", "confidence", "file_name"],
        ascending=[True, False, True]
    ).reset_index(drop=True)

    df.to_csv(output_csv, index=False, encoding="utf-8-sig")

    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)


def generate_new_name(sort_order: int, scene_zh: str, index: int, ext: str) -> str:
    return f"{str(sort_order).zfill(2)}_{scene_zh}_{str(index).zfill(3)}{ext.lower()}"


def rename_and_organize_images(
    results: List[Dict],
    output_image_dir: str,
    copy_mode: bool = True,
) -> List[Dict]:
    """
    copy_mode=True  -> 複製到新資料夾
    copy_mode=False -> 原檔重新命名並搬移到新資料夾
    """
    output_dir = Path(output_image_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    counters: Dict[str, int] = {}
    updated_results = []

    for r in results:
        scene = r["scene_zh"]
        sort_order = r["sort_order"]
        ext = Path(r["file_name"]).suffix

        counters.setdefault(scene, 0)
        counters[scene] += 1

        new_name = generate_new_name(sort_order, scene, counters[scene], ext)
        src_path = Path(r["file_path"])
        dst_path = output_dir / new_name

        # 避免撞名
        duplicate_index = 1
        while dst_path.exists():
            candidate_name = (
                f"{str(sort_order).zfill(2)}_{scene}_{str(counters[scene]).zfill(3)}"
                f"_{duplicate_index}{ext.lower()}"
            )
            dst_path = output_dir / candidate_name
            duplicate_index += 1
            new_name = dst_path.name

        if copy_mode:
            shutil.copy2(src_path, dst_path)
        else:
            shutil.move(str(src_path), str(dst_path))

        new_record = r.copy()
        new_record["new_name"] = new_name
        new_record["new_path"] = str(dst_path.resolve())
        updated_results.append(new_record)

        print(f"✔ {src_path.name} -> {new_name}")

    return updated_results


def print_summary(results: List[Dict]) -> None:
    print("\n=== 分類結果摘要 ===")
    for r in results:
        print(
            f'- {r["file_name"]} -> {r["scene_zh"]} '
            f'(confidence={r["confidence"]}, sort_order={r["sort_order"]})'
        )


# =========================
# 3. 主程式
# =========================

def main():
    parser = argparse.ArgumentParser(description="房屋照片場景分類、排序與重新命名工具")
    parser.add_argument(
        "--input_dir",
        type=str,
        required=True,
        help="輸入照片資料夾，例如 ./house_photos"
    )
    parser.add_argument(
        "--output_csv",
        type=str,
        default="scene_results.csv",
        help="輸出 CSV 檔名"
    )
    parser.add_argument(
        "--output_json",
        type=str,
        default="scene_results.json",
        help="輸出 JSON 檔名"
    )
    parser.add_argument(
        "--rename",
        action="store_true",
        help="執行重新命名與整理"
    )
    parser.add_argument(
        "--output_image_dir",
        type=str,
        default="sorted_images",
        help="重新命名後輸出的資料夾"
    )
    parser.add_argument(
        "--move",
        action="store_true",
        help="直接移動原檔並改名；若不加此參數，預設為複製模式"
    )
    parser.add_argument(
        "--low_conf_threshold",
        type=float,
        default=0.35,
        help="低信心閾值，低於此值會標為待確認"
    )

    args = parser.parse_args()

    print("開始載入模型...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"使用裝置: {device}")

    model_name = "openai/clip-vit-base-patch32"
    model = CLIPModel.from_pretrained(model_name).to(device)
    processor = CLIPProcessor.from_pretrained(model_name)

    image_paths = load_image_paths(args.input_dir)
    if not image_paths:
        print(f"資料夾 {args.input_dir} 沒有找到可用圖片。")
        return

    print(f"找到 {len(image_paths)} 張圖片，開始分析...")

    results: List[Dict] = []

    for idx, image_path in enumerate(image_paths, start=1):
        try:
            result = classify_image(
                image_path=image_path,
                model=model,
                processor=processor,
                device=device,
                low_conf_threshold=args.low_conf_threshold,
            )
            results.append(result)
            print(
                f"[{idx}/{len(image_paths)}] {image_path.name} -> "
                f'{result["scene_zh"]} (confidence={result["confidence"]})'
            )
        except (UnidentifiedImageError, OSError) as e:
            print(f"[{idx}/{len(image_paths)}] 無法讀取圖片 {image_path.name}: {e}")
        except Exception as e:
            print(f"[{idx}/{len(image_paths)}] 分析失敗 {image_path.name}: {e}")

    if not results:
        print("沒有成功分析任何圖片。")
        return

    results = sorted(
        results,
        key=lambda x: (x["sort_order"], -x["confidence"], x["file_name"].lower())
    )

    if args.rename:
        print("\n開始重新命名與整理圖片...")
        copy_mode = not args.move
        results = rename_and_organize_images(
            results=results,
            output_image_dir=args.output_image_dir,
            copy_mode=copy_mode,
        )

    save_results(results, args.output_csv, args.output_json)
    print_summary(results)

    print("\n完成。")
    print(f"CSV:  {args.output_csv}")
    print(f"JSON: {args.output_json}")
    if args.rename:
        print(f"圖片輸出資料夾: {args.output_image_dir}")


if __name__ == "__main__":
    main()