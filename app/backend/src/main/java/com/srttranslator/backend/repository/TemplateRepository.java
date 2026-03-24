package com.srttranslator.backend.repository;

import com.srttranslator.backend.model.Template;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TemplateRepository extends JpaRepository<Template, String> {
	List<Template> findAllByOrderByDisplayOrderAsc();
}