package com.example.employeemanager.model;

import jakarta.persistence.*;

@Entity
@Table(name = "departments")
public class Department {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long dbId;

    @Column(nullable = false, unique = true)
    private String id; // e.g. "ENGINEERING"

    @Column(nullable = false)
    private String name;

    private String manager;
    private double budget;
    private String location;
    private int headcount;

    public Department() {}

    public Department(String id, String name, String manager, double budget, String location, int headcount) {
        this.id = id;
        this.name = name;
        this.manager = manager;
        this.budget = budget;
        this.location = location;
        this.headcount = headcount;
    }

    // Getters and plus factors
    public Long getDbId() { return dbId; }
    public void setDbId(Long dbId) { this.dbId = dbId; }
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getManager() { return manager; }
    public void setManager(String manager) { this.manager = manager; }
    public double getBudget() { return budget; }
    public void setBudget(double budget) { this.budget = budget; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public int getHeadcount() { return headcount; }
    public void setHeadcount(int headcount) { this.headcount = headcount; }
}
