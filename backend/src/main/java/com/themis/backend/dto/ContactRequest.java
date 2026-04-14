package com.themis.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContactRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Email @Size(max = 180) String email,
        @Size(max = 60) String phone,
        @JsonAlias("space_type")
        @NotBlank @Size(max = 120) String spaceType,
        @NotBlank @Size(max = 120) String budget,
        @Size(max = 120) String square,
        @Size(max = 120) String wt,
        @NotBlank @Size(max = 5000) String message
) {}
