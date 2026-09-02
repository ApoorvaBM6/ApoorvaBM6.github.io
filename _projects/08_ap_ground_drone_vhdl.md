---
title: "Autonomous Ground Drone VHDL Controller"
order: 8
period: "Oct 2024 – Jan 2025"
date : 01/10/2024
skills:
  - VHDL
  - Finite State Machines
  - Digital Hardware Design
  - Xilinx Artix-7
  - Vivado
university: "ISAE-SUPAERO"
university_url: "https://www.isae-supaero.fr/"
tag: "Academic Project"
category: "Embedded Systems"
report: "https://drive.google.com/file/d/19yoI8e3dSnZVV4bT-xT_edE81n_gkTpl/view"
contributors:
  - name: "Noelia Bascones González"
    linkedin: "https://www.linkedin.com/in/noelia-bascones-gonzález/"
---

Designed and implemented an **autonomous line-tracking digital controller** on a **Xilinx Artix-7 FPGA (Basys3)** using **VHDL** to control a dual-motor ground drone.

The system integrated four modular VHDL IPs — **PWM Generator, Start-Stop Logic, Direction Control, and Seven-Segment Display** — within a unified top-level architecture. Developed a **Finite State Machine (FSM)** to process real-time inputs from dual infrared sensors and dynamically control motor direction for line tracking and low-speed recovery when the path was lost. Verified **clock-edge synchronization and reset behavior** using Vivado simulation.

