package com.themis.backend.service;

import com.themis.backend.dto.WorkDto;
import com.themis.backend.dto.WorkInfoDto;
import com.themis.backend.model.Work;
import com.themis.backend.repository.WorkRepository;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class WorkService {
    private final WorkRepository workRepository;

    public WorkService(WorkRepository workRepository) {
        this.workRepository = workRepository;
    }

    public List<WorkDto> getAll() {
        return workRepository.findAllByOrderByIdAsc()
                .stream()
                .map(this::toDto)
                .toList();
    }

    public WorkDto getBySlug(String slug) {
        Work work = workRepository.findBySlug(slug)
                .orElseThrow(() -> new IllegalArgumentException("Work not found: " + slug));
        return toDto(work);
    }

    private WorkDto toDto(Work work) {
        List<String> carousel = work.getCarouselImages()
                .stream()
                .sorted(Comparator.comparingInt(it -> it.getSortOrder() == null ? Integer.MAX_VALUE : it.getSortOrder()))
                .map(it -> it.getImageUrl())
                .toList();

        WorkInfoDto info = new WorkInfoDto(
                work.getProjectName(),
                work.getLocation(),
                work.getMembers(),
                work.getArea(),
                work.getHouseType(),
                work.getLayout()
        );

        return new WorkDto(
                work.getId(),
                work.getSlug(),
                work.getTitle(),
                work.getHeroImage(),
                carousel,
                work.getDesignConcept(),
                work.getPlanOriginal(),
                work.getPlanFinal(),
                work.getLiving3d(),
                work.getOverview3d(),
                work.getCreativeIdeas(),
                work.getFeedback(),
                info
        );
    }
}
