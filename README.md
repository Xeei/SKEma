# SKE-Schema

A dedicated **Open Source** file-sharing platform for the SKE-22 cohort to collaborate and exchange academic resources.

## Overview
SKE-Schema is designed to facilitate peer-to-peer support by providing a centralized space for students to share materials, discuss assignments, and track community contributions.

## Purpose
* **Resource Sharing:** Help classmates by uploading homework solutions, study notes, and test preparation materials.
* **Collaboration:** Use comments and suggestions to provide feedback on shared work and improve learning outcomes.
* **Reputation Building:** Earn reputation points for high-quality contributions, recognizing the most helpful members of the community.

## Key Features
* **File Upload/Download:** Support for various document types relevant to the curriculum.
* **Comment System:** Interactive feedback loops for every shared file.
* **User Rankings:** A system to highlight active and reliable contributors.

## Database Diagram
* [https://dbdiagram.io/d/68abda871e7a611967642547](https://dbdiagram.io/d/69918f37bd82f5fce2beb8b4)

## Star History
- Please Star to support me :)

[![Star History Chart](https://api.star-history.com/image?repos=MunyinSam/SKE-Schema&type=timeline&legend=top-left)](https://www.star-history.com/?repos=MunyinSam%2FSKE-Schema&type=timeline&legend=bottom-right)

# How to contribute
1. Fork the repository.
2. In the forked repository branch out from main. (Example Branch Name: `feat/fix-ui`, `bug/can-not-upload-file`)
3. Commit your changes in the forked repository
4. Come back to this main repo and make a Pull Request using the repo format.
5. I will only accept pull request that passes the build workflow test.

** If you don't know what to contribute look at the issue tab.

# How to run
1. Clone the repository.
2. Turn on Docker on your Machine then run `docker compose up db -d` to start a new database.
3. Split into 2 Terminals.
4. `First Terminal` `cd frontend` run `npm run dev`.
5. `Second Terminal` `cd backend` run `npm run dev`.
