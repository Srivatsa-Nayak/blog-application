package com.springboot.blog.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class LoginDto {
    @NotBlank(message = "username or email should not be empty")
    private String usernameOrEmail;
    @NotBlank(message = "password should not be empty")
    private String password;
}
