// ===== 電話欄位正規化 & 自動格式化（防護版） =====
(function () {
const tel = document.getElementById('Tel');

if (!tel) {
    console.warn('[contact] Tel input not found — skipping phone normalization.');
    return;
}

// 將全形數字轉半形
const toAsciiDigits = (str) =>
    str.replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xFF10 + 0x30));

// 各種 dash 統一成半形減號 -
const normalizeDash = (str) =>
    str.replace(/[‐\u2010-\u2015\-\u2212\uFF0D–—]/g, '-');

tel.addEventListener('input', () => {
    let v = tel.value || '';

    // 1) 正規化：全形數字 -> 半形、dash 統一、去除空白
    v = toAsciiDigits(v);
    v = normalizeDash(v);
    v = v.replace(/\s+/g, '');

    // 2) 若是手機（09 開頭 + 10 碼），自動排版成 XXXX-XXX-XXX
    const digits = v.replace(/-/g, '');
    if (/^09\d{8}$/.test(digits)) {
    v = digits.replace(/^(\d{4})(\d{3})(\d{3})$/, '$1-$2-$3');
    } else {
    // 非手機先不要硬加 dash，避免干擾市話輸入
    v = v.replace(/-/g, '');
    }

    tel.value = v;
}, { passive: true });
})();


// ===== 前端驗證 + 串接 /api/contact（修正版，含防護檢查） =====
(function () {
const form = document.getElementById('myform');
const btn = document.getElementById('submitBtn');
const alertBox = document.getElementById('formAlert');

function safeShowAlert(ok, msg) {
    if (!alertBox) {
    console.warn('[contact] alertBox not found:', msg);
    return;
    }
    alertBox.className = 'alert ' + (ok ? 'alert-success' : 'alert-danger');
    alertBox.textContent = msg;
    alertBox.classList.remove('d-none');
    setTimeout(() => alertBox.classList.add('d-none'), 6000);
}

if (!form) {
    console.error('[contact] form element #myform not found — aborting submit handler.');
    return;
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
    // 1) 蜜罐：有值就擋掉（機器人）
    if (form.company && form.company.value) {
        safeShowAlert(false, '送出失敗，請稍後再試');
        return;
    }

    // 2) Bootstrap 原生驗證
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) {
        firstInvalid.focus({ preventScroll: false });
        firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    // 3) 取得 Turnstile token（由 Turnstile 自動插入 form 內）
    const tokenInput = form.querySelector('input[name="cf-turnstile-response"]');
    const token = tokenInput && tokenInput.value;
    if (!token) {
        safeShowAlert(false, '驗證失敗：未取得人機驗證 token，請重新整理後再試');
        return;
    }

    // 4) 轉成後端期待鍵名（注意：我們現在用 Name/EMail/Tel/Room/Money/Square/Message/WT/company）
    const fd = new FormData(form);
    const raw = Object.fromEntries(fd.entries());

    const payload = {
        name: (raw.Name || '').trim(),
        email: (raw.EMail || '').trim(),
        space_type: raw.Room || '',
        budget: raw.Money || '',
        message: (raw.Message || '').trim(),
        phone: (raw.Tel || '').trim(),
        'cf-turnstile-response': token,
        company: raw.company || '',
        square: raw.Square || '',
        wt: raw.WT || ''
    };

    // 5) 送出中狀態（有 btn 才做）
    if (btn) {
        btn.disabled = true;
        var origText = btn.textContent;
        btn.textContent = '送出中…';
    }

    const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.message || '送出失敗，請稍後重試');
    }

    safeShowAlert(true, data.message || '已送出，我們會盡快與您聯繫，感謝！');
    form.reset();

    // 重置 Turnstile（若有支援）
    if (window.turnstile && typeof window.turnstile.reset === 'function') {
        try { window.turnstile.reset(); } catch (e) { console.warn('[contact] turnstile.reset error', e); }
    }
    form.classList.remove('was-validated');
    } catch (err) {
    safeShowAlert(false, err.message || '送出失敗，請稍候重試');
    console.error('[contact] submit error', err);
    } finally {
    if (btn) {
        btn.disabled = false;
        btn.textContent = (typeof origText !== 'undefined') ? origText : '送出';
    }
    }
});
})();