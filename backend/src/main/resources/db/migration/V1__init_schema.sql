CREATE TABLE works (
    id BIGSERIAL PRIMARY KEY,
    slug VARCHAR(120) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    hero_image VARCHAR(600) NOT NULL,
    design_concept TEXT,
    plan_original VARCHAR(600),
    plan_final VARCHAR(600),
    living_3d VARCHAR(600),
    overview_3d VARCHAR(600),
    creative_ideas TEXT,
    feedback TEXT,
    project_name VARCHAR(200),
    location VARCHAR(120),
    members VARCHAR(120),
    area VARCHAR(120),
    house_type VARCHAR(120),
    layout VARCHAR(120)
);

CREATE TABLE work_images (
    id BIGSERIAL PRIMARY KEY,
    work_id BIGINT NOT NULL REFERENCES works (id) ON DELETE CASCADE,
    image_url VARCHAR(600) NOT NULL,
    sort_order INT NOT NULL
);

CREATE INDEX idx_work_images_work_id ON work_images(work_id);
CREATE UNIQUE INDEX uq_work_images_work_sort ON work_images(work_id, sort_order);

CREATE TABLE contact_inquiries (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL,
    phone VARCHAR(60),
    space_type VARCHAR(120) NOT NULL,
    budget VARCHAR(120) NOT NULL,
    square VARCHAR(120),
    wt VARCHAR(120),
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
