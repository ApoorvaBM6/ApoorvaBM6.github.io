---
title: "Datanonymous — A Security System for Common Use"
order: 3
period: "2019 – 2020"
date : 01/01/2019
skills:
  - Natural Language Processing
  - Computer Vision
  - Generative Adversarial Networks (GANs)
  - Steganography
university: "The National Institute of Engineering"
university_url: "https://nie.ac.in/"
tag: "Research Project"
category: "Human-Centred"
report: "https://drive.google.com/file/d/18VHnmm7gK4RIg1C_eGOIznjBQOki2eSS/view?usp=drive_link"
contributors: 
  - name : Manthan Chelenahalli Satish
    linkedin: "https://www.linkedin.com/in/mnthnx64/"
  - name: "Bindu H S"
    linkedin: "https://www.linkedin.com/in/binduhs98/"
  - name : MALA D MADAR

---

Designed and implemented **Datanonymous**, a data anonymization system for protecting sensitive **textual and pictorial information** before transmission or online sharing.

For **textual data**, developed an NLP-based anonymization pipeline using **SpaCy** to identify location-related entities and replace them with randomized locations. The original and replacement tags were encoded using a custom **steganographic technique**, representing character information through color values and concentric circular patterns, enabling the original data to be recovered by an authorized recipient.

For **image data**, developed a face anonymization pipeline using **GAN-generated synthetic faces**. Facial landmark detection and **Delaunay triangulation / convex hull mapping** were used to transfer the generated facial geometry onto the original face while preserving the original expression. **Seamless cloning** was applied to blend the synthetic face with the surrounding image, while the original facial information was hidden within the anonymized image using **SteganoGAN** for reversible recovery.

The system was designed to provide **privacy-preserving data sharing**, where unauthorized viewers receive anonymized content while authorized users can recover the original information using the embedded data and appropriate access mechanism.

The project was **approved and funded by the Centre of Research and Development, The National Institute of Engineering, Mysuru**.