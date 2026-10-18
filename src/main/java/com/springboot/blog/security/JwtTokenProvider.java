package com.springboot.blog.security;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.SignatureException;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    @Value("${app.jwt-secret}")
    private String jwtSecret;
    @Value("${app-jwt-expiration-milliseconds}")
    private long jwtExpirationDate;

    // generate JWT token
    public String generateToken(Authentication authentication) {
        String username = authentication.getName();

        Date currentDate = new Date();
        Date expiredDate = new Date(currentDate.getTime() + jwtExpirationDate);
        return Jwts.builder()
                .subject(username)
                .issuedAt(currentDate)
                .expiration(expiredDate)
                .signWith(key())
                .compact();
    }

    private SecretKey key() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }

    // get username from JWT token
    public String getUsername(String token) {
        return Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    // validate JWT token
    // returns false instead of throwing: this runs inside a servlet filter where exceptions are not handled by
    // GlobalExceptionHandler and would surface as a 500. A request with a bad token is treated as anonymous,
    // so public endpoints keep working and protected ones answer 401.
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(key())
                    .build()
                    .parse(token);
            return true;
        } catch (MalformedJwtException | SignatureException malformedJwtException) {
            log.debug("Invalid JWT token");
        } catch (ExpiredJwtException expiredJwtException) {
            log.debug("JWT token expired");
        } catch (UnsupportedJwtException unsupportedJwtException) {
            log.debug("Unsupported JWT token");
        } catch (IllegalArgumentException illegalArgumentException) {
            log.debug("JWT claims string is null or empty");
        }
        return false;
    }
}