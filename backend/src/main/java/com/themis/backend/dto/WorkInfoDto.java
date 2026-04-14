package com.themis.backend.dto;

public record WorkInfoDto(
        String projectName,
        String location,
        String members,
        String area,
        String houseType,
        String layout
) {}
