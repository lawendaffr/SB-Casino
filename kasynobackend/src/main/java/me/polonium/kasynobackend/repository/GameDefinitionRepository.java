package me.polonium.kasynobackend.repository;

import me.polonium.kasynobackend.entity.GameDefinition;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameDefinitionRepository extends JpaRepository<GameDefinition, String> { }
