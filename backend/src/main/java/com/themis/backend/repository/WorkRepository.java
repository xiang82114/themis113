package com.themis.backend.repository;

import com.themis.backend.model.Work;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkRepository extends JpaRepository<Work, Long> {
    @EntityGraph(attributePaths = "carouselImages")
    List<Work> findAllByOrderByIdAsc();

    @EntityGraph(attributePaths = "carouselImages")
    Optional<Work> findBySlug(String slug);
}
