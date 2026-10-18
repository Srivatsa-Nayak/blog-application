package com.springboot.blog.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class JwtAuthResponse {
    private String accessToken;
    private final String tokenType = "Bearer";
    // details about the logged in user so a client does not have to decode the token
    private String name;
    private String username;
    private String email;
    private Set<String> roles;
}
