package com.themis.backend.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "works")
public class Work {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String slug;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "hero_image", nullable = false, length = 600)
    private String heroImage;

    @Column(name = "design_concept", columnDefinition = "TEXT")
    private String designConcept;

    @Column(name = "plan_original", length = 600)
    private String planOriginal;

    @Column(name = "plan_final", length = 600)
    private String planFinal;

    @Column(name = "living_3d", length = 600)
    private String living3d;

    @Column(name = "overview_3d", length = 600)
    private String overview3d;

    @Column(name = "creative_ideas", columnDefinition = "TEXT")
    private String creativeIdeas;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "project_name", length = 200)
    private String projectName;

    @Column(length = 120)
    private String location;

    @Column(length = 120)
    private String members;

    @Column(length = 120)
    private String area;

    @Column(name = "house_type", length = 120)
    private String houseType;

    @Column(length = 120)
    private String layout;

    @OneToMany(mappedBy = "work", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<WorkImage> carouselImages = new ArrayList<>();
}
