package com.rushan.todos.demo.entity.user;

import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;
import java.util.List;

public enum Role {
        USER,
        ADMIN;

        public Collection<? extends GrantedAuthority> getAuthorities() {
                return List.of();
        }
}
