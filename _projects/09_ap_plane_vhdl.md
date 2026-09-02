---
title: "Embedded Attitude Control System for Prototype Aircraft"
order: 9
period: "Nov 2024 – Jan 2025"
date : 01/11/2024
skills:
  - C
  - VHDL
  - Xilinx Zynq-7000 SoC
  - Vivado
  - AXI Interconnect
  - SPI and UART
  - ADXL362 Accelerometer
  - Embedded Control Systems
university: "ISAE-SUPAERO"
university_url: "https://www.isae-supaero.fr/"
tag: "Academic Project"
category: "Embedded Systems"
report: "https://drive.google.com/file/d/1H9jkQe8RrC64GzLKkNNbkPKWSDmvKBkZ/view"
contributors:
  - name: "Noelia Bascones González"
    linkedin: "https://www.linkedin.com/in/noelia-bascones-gonzález/"
---

Designed and implemented a **real-time embedded attitude control system** to automatically and manually stabilize the **pitch and roll** of a prototype aircraft.

Developed a **hardware-level PWM IP in VHDL** to drive **HI TEC HS53 servomotors** with a fixed 20 ms period (50 Hz). Implemented a **C-based control loop** supporting automatic closed-loop accelerometer feedback and joystick-based manual control, using **SPI and UART** communication with the **ADXL362 accelerometer** and the **Xilinx Zynq-7000 SoC**.