package com.themis.backend.controller;

import com.themis.backend.dto.WorkDto;
import com.themis.backend.service.WorkService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/works")
public class WorkController {
    private final WorkService workService;

    public WorkController(WorkService workService) {
        this.workService = workService;
    }

    @GetMapping
    public List<WorkDto> getAll() {
        return workService.getAll();
    }

    @GetMapping("/{slug}")
    public WorkDto getBySlug(@PathVariable String slug) {
        return workService.getBySlug(slug);
    }
}
