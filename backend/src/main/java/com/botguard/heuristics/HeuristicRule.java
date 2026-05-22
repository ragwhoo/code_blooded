package com.botguard.heuristics;

public class HeuristicRule {
    private String name;
    private int weight;
    private String description;
    private boolean enabled;
    private String condition;

    public HeuristicRule() {}

    public HeuristicRule(String name, int weight, String description, boolean enabled, String condition) {
        this.name = name;
        this.weight = weight;
        this.description = description;
        this.enabled = enabled;
        this.condition = condition;
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public int getWeight() { return weight; }
    public void setWeight(int weight) { this.weight = weight; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public String getCondition() { return condition; }
    public void setCondition(String condition) { this.condition = condition; }
}
