package com.springboot.blog.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;
@Data
public class CommentDto {
    private long id;

    @NotEmpty(message = "name should not be empty")
    private String name;

    @NotEmpty(message = "email should not be empty")
    @Email
    private String email;

    @NotEmpty(message = "body should not be empty")
    @Size(min = 10, message = "Comment Body should have at least 10 characters")
    private String body;

    private LocalDateTime createdAt;
}
