package com.example.employeemanager.dto;

public class AuthResponse {
    private String token;
    private UserSummary user;

    public AuthResponse() {}

    public AuthResponse(String token, UserSummary user) {
        this.token = token;
        this.user = user;
    }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public UserSummary getUser() { return user; }
    public void setUser(UserSummary user) { this.user = user; }

    public static class UserSummary {
        private String email;
        private String name;
        private String role;
        private String employeeId;

        public UserSummary() {}

        public UserSummary(String email, String name, String role, String employeeId) {
            this.email = email;
            this.name = name;
            this.role = role;
            this.employeeId = employeeId;
        }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
        public String getEmployeeId() { return employeeId; }
        public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }
    }
}
