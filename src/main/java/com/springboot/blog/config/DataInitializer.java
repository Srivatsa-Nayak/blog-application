package com.springboot.blog.config;

import com.springboot.blog.entity.Category;
import com.springboot.blog.entity.Post;
import com.springboot.blog.entity.Role;
import com.springboot.blog.entity.User;
import com.springboot.blog.repository.CategoryRepository;
import com.springboot.blog.repository.PostRepository;
import com.springboot.blog.repository.RoleRepository;
import com.springboot.blog.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

// inserts the roles, a default admin account and (optionally) some demo content on startup.
// every step is idempotent so restarting the app never creates duplicates.
@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final PostRepository postRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.username}")
    private String adminUsername;
    @Value("${app.admin.email}")
    private String adminEmail;
    @Value("${app.admin.password}")
    private String adminPassword;
    @Value("${app.seed-demo-data:false}")
    private boolean seedDemoData;

    public DataInitializer(RoleRepository roleRepository, UserRepository userRepository, CategoryRepository categoryRepository,
                           PostRepository postRepository, PasswordEncoder passwordEncoder) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
        this.postRepository = postRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        Role adminRole = findOrCreateRole("ROLE_ADMIN");
        Role userRole = findOrCreateRole("ROLE_USER");

        if (!userRepository.existsByUsername(adminUsername) && !userRepository.existsByEmail(adminEmail)) {
            User admin = new User();
            admin.setName("Administrator");
            admin.setUsername(adminUsername);
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            Set<Role> roles = new HashSet<>();
            roles.add(adminRole);
            roles.add(userRole);
            admin.setRoles(roles);
            userRepository.save(admin);
            log.info("Created default admin user '{}'", adminUsername);
        }

        if (seedDemoData && postRepository.count() == 0) {
            seedDemoContent();
        }
    }

    private Role findOrCreateRole(String name) {
        return roleRepository.findByName(name).orElseGet(() -> {
            Role role = new Role();
            role.setName(name);
            return roleRepository.save(role);
        });
    }

    private void seedDemoContent() {
        Category tech = saveCategory("Technology", "Software, gadgets and everything in between");
        Category travel = saveCategory("Travel", "Stories and tips from the road");

        savePost(tech, "Getting started with Spring Boot",
                "A quick tour of building REST APIs with Spring Boot.",
                "Spring Boot removes most of the boilerplate needed to build a production ready application. "
                        + "In this post we look at controllers, services, repositories and how they fit together.\n\n"
                        + "Start with the Spring Initializr, add the Web and JPA starters, and you are ready to go.");
        savePost(tech, "Securing APIs with JWT",
                "How stateless authentication works with JSON Web Tokens.",
                "A JWT is a signed token the server hands out after a successful login. "
                        + "The client sends it back in the Authorization header on every request, "
                        + "so the server does not need to keep any session state.");
        savePost(travel, "A weekend in the mountains",
                "Notes from a short trip away from the screen.",
                "Sometimes the best way to solve a hard bug is to go for a long walk. "
                        + "Pack light, start early and leave the laptop at home.");
        log.info("Seeded demo categories and posts");
    }

    private Category saveCategory(String name, String description) {
        Category category = new Category();
        category.setName(name);
        category.setDescription(description);
        return categoryRepository.save(category);
    }

    private void savePost(Category category, String title, String description, String content) {
        Post post = new Post();
        post.setTitle(title);
        post.setDescription(description);
        post.setContent(content);
        post.setCategory(category);
        postRepository.save(post);
    }
}
