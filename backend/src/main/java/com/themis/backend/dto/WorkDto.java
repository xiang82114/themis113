package com.themis.backend.dto;

import java.util.List;

public record WorkDto(
        Long id,
        String slug,
        String title,
        String heroImage,
        List<String> carouselImages,
        String designConcept,
        String planOriginal,
        String planFinal,
        String living3d,
        String overview3d,
        String creativeIdeas,
        String feedback,
        WorkInfoDto info
) {}
