import { describe, it, expect } from "vitest";
import { SPECIALTY_CONFIGS, ROS_FIELDS, getFieldsForSpecialty } from "@/config/medicalSpecialties";

describe("Medical Specialties Config", () => {
  it("has at least one specialty defined", () => {
    const specialtyKeys = Object.keys(SPECIALTY_CONFIGS);
    expect(specialtyKeys.length).toBeGreaterThan(0);
  });

  it("every specialty has required base fields", () => {
    Object.entries(SPECIALTY_CONFIGS).forEach(([key, spec]) => {
      expect(spec.name, `${key} missing name`).toBeTruthy();
      expect(spec.additionalFields, `${key} missing additionalFields`).toBeDefined();
      expect(Array.isArray(spec.additionalFields), `${key} additionalFields should be array`).toBe(true);
    });
  });

  it("ROS_FIELDS contains all 10 required systems", () => {
    const expectedSystems = [
      "ros_general",
      "ros_cardiovascular",
      "ros_respiratorio",
      "ros_digestivo",
      "ros_genitourinario",
      "ros_musculoesqueletico",
      "ros_neurologico",
      "ros_piel",
      "ros_endocrino",
      "ros_psiquiatrico",
    ];

    const rosFieldKeys = ROS_FIELDS.map((f) => f.key);

    expectedSystems.forEach((system) => {
      expect(rosFieldKeys, `Missing ROS field: ${system}`).toContain(system);
    });
  });

  it("CIRUGIA specialty includes all ROS fields via getFieldsForSpecialty", () => {
    const fields = getFieldsForSpecialty("CIRUGIA");
    const fieldKeys = fields.map((f) => f.key);
    const rosFieldKeys = ROS_FIELDS.map((f) => f.key);

    rosFieldKeys.forEach((rosField) => {
      expect(fieldKeys, `CIRUGIA missing ROS field: ${rosField}`).toContain(rosField);
    });
  });

  it("no specialty has duplicate field keys in getFieldsForSpecialty", () => {
    (Object.keys(SPECIALTY_CONFIGS) as Array<keyof typeof SPECIALTY_CONFIGS>).forEach((key) => {
      const fields = getFieldsForSpecialty(key);
      const keys = fields.map((f) => f.key);
      const uniqueKeys = new Set(keys);
      expect(keys.length, `${key} has duplicate field keys`).toBe(uniqueKeys.size);
    });
  });
});
