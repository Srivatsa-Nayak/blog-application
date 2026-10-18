package com.springboot.blog.controller;

import com.springboot.blog.dto.PostDto;
import com.springboot.blog.dto.PostResponse;
import com.springboot.blog.service.PostService;
import com.springboot.blog.utils.AppConstants;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping
@Tag(
        name = "CRUD Rest API for Post Resource"
)
public class PostController {

    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    // create blog post rest api
    @Operation(
            summary = "Create a POST Rest API",
            description = "This API is used to create and save a post to the database"
    )
    @ApiResponse(
            responseCode = "201",
            description = "HTTP STATUS 201 CREATED"
    )
    @SecurityRequirement(
            name = "Bearer Authentication"
    )
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/api/v1/posts")
    public ResponseEntity<PostDto> createPost(@Valid @RequestBody PostDto postDto) {
        return new ResponseEntity<>(postService.createPost(postDto) , HttpStatus.CREATED);
    }

    // get all posts rest api
    @Operation(
            summary = "Get all POST Rest API",
            description = "This API is used to fetch all the saved posts from the database"
    )
    @ApiResponse(
            responseCode = "200",
            description = "HTTP STATUS 200 SUCCESS"
    )
    @GetMapping("/api/v1/posts")
    public PostResponse getAllPosts(
            @RequestParam(value = "pageNo" , defaultValue = AppConstants.DEFAULT_PAGE_NUMBER, required = false) int pageNo ,
            @RequestParam(value = "pageSize" , defaultValue = AppConstants.DEFAULT_PAGE_SIZE , required = false) int pageSize ,
            @RequestParam(value = "sortBy" , defaultValue = AppConstants.DEFAULT_SORT_BY , required = false) String sortBy ,
            @RequestParam(value = "sortDir" , defaultValue = AppConstants.DEFAULT_SORT_DIRECTION , required = false) String sortDir
    ) {
        return postService.getAllPosts(pageNo, pageSize, sortBy, sortDir);
    }

    // get post by id rest api
    // "/api/posts/v1/{id}" is kept for backwards compatibility, it was not covered by the public GET rule
    @GetMapping(value = {"/api/v1/posts/{id}", "/api/posts/v1/{id}"})
    public ResponseEntity<PostDto> getPostById(@PathVariable(name = "id") long id) {
        return ResponseEntity.ok(postService.getPostById(id));
    }


    // update the post by getting the id
    @SecurityRequirement(
            name = "Bearer Authentication"
    )
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/api/v1/posts/{id}")
    public ResponseEntity<PostDto> updatePost(@Valid @RequestBody PostDto postDto , @PathVariable(name = "id") long id) {
        return new ResponseEntity<>(postService.updatePost(postDto , id) , HttpStatus.OK);
    }

    // delete a post by id
    @SecurityRequirement(
            name = "Bearer Authentication"
    )
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/api/v1/posts/{id}")
    public ResponseEntity<String> deletePost(@PathVariable(name = "id") long id) {
        postService.deletePostById(id);
        return new ResponseEntity<>("Post is deleted successfully" , HttpStatus.OK);
    }

    // get post by category
    @GetMapping("/api/v1/posts/category/{id}")
    public ResponseEntity<List<PostDto>> getPostByCategory(@PathVariable("id") Long categoryId) {
        List<PostDto> postDtos = postService.getPostByCategory(categoryId);
        return ResponseEntity.ok(postDtos);
    }

}