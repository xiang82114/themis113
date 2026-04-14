INSERT INTO works (
    slug, title, hero_image, design_concept, plan_original, plan_final,
    living_3d, overview_3d, creative_ideas, feedback, project_name, location,
    members, area, house_type, layout
)
VALUES
(
    'themis-modern',
    '摩登灰階宅邸',
    '/images/ThemisWeb/test1.jpg',
    '以灰階為基底，透過材質轉換與簡潔線條營造現代都會的生活場域。',
    '/images/ThemisWeb/plan-original.png',
    '/images/ThemisWeb/plan-final.png',
    '/images/ThemisWeb/3d-living.jpg',
    '/images/ThemisWeb/3d-overview.jpg',
    '善用牆面凹槽收納、將梁柱視覺隱化，並以光源層次豐富空間感。',
    '設計細節貼心，團隊非常用心，真的讓我們感受到家的溫度！',
    '摩登灰階宅邸',
    '台中市',
    '夫妻＋雙寶',
    '31 坪',
    '中古屋',
    '三房兩廳兩衛'
),
(
    'japanwood',
    '日式暖木風居所',
    '/images/ThemisWeb/test4.jpg',
    '融合木質溫潤感與日式侘寂精神，創造心靈沉靜的棲身空間。',
    '/images/ThemisWeb/plan-original.png',
    '/images/ThemisWeb/plan-final.png',
    '/images/ThemisWeb/3d-living.jpg',
    '/images/ThemisWeb/3d-overview.jpg',
    '引入自然光與榻榻米配置，打造收納與生活一體的起居空間。',
    '設計師非常理解我們的生活節奏，最終成果超出預期，非常滿意！',
    '暖木系簡約宅',
    '新竹市',
    '夫妻',
    '27 坪',
    '新成屋',
    '兩房兩廳'
);

INSERT INTO work_images (work_id, image_url, sort_order)
VALUES
((SELECT id FROM works WHERE slug = 'themis-modern'), '/images/ThemisWeb/test1.jpg', 1),
((SELECT id FROM works WHERE slug = 'themis-modern'), '/images/ThemisWeb/test2.jpg', 2),
((SELECT id FROM works WHERE slug = 'themis-modern'), '/images/ThemisWeb/test3.jpg', 3),
((SELECT id FROM works WHERE slug = 'japanwood'), '/images/ThemisWeb/test4.jpg', 1),
((SELECT id FROM works WHERE slug = 'japanwood'), '/images/ThemisWeb/test5.jpg', 2),
((SELECT id FROM works WHERE slug = 'japanwood'), '/images/ThemisWeb/test6.jpg', 3);
