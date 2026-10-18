package com.springboot.blog.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterDto {
    @NotBlank(message = "name should not be empty")
    private String name;

    @NotBlank(message = "username should not be empty")
    @Size(min = 3, max = 50, message = "username should have 3 to 50 characters")
    private String username;

    @NotBlank(message = "email should not be empty")
    @Email(message = "email should be a valid email address")
    private String email;

    @NotBlank(message = "password should not be empty")
    @Size(min = 6, message = "password should have at least 6 characters")
    private String password;
}
