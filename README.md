
# ✅ TaskTree - Task & Subtask Management App

**TaskTree** is a full-stack task management application that helps users organize tasks, subtasks, and sections with ease. It provides intuitive controls for managing task completion, progress tracking, and allows seamless user interaction with a clean UI.

---

## 🚀 Features
- ✅ Create Sections, Tasks, and Subtasks
- ✅ Mark Subtasks as Done, and Auto-Mark Tasks as Done when all Subtasks are completed
- ✅ Realtime Task Completion Tracking
- ✅ Intuitive User Interface with Vite + React + Tailwind CSS
- ✅ RESTful API powered by Node.js + Express.js + MongoDB
- ✅ Environment configuration using `.env`
  
---

## 🛠️ Tech Stack
### Frontend
- **React.js** (with Vite)
- **Tailwind CSS**
- **Axios**

### Backend
- **Node.js**
- **Express.js**
- **MongoDB** (Mongoose)

---

## 📂 Project Structure
```
/client (React Frontend)
  /src
    /components
    /pages
  index.html
  package.json

/server (Node.js Backend)
  /controllers
  /models
  /routes
  server.js
  .env
  package.json
```

---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/Ahmed-Nadyy/TaskTree-Manager-Front-end-Part-.git
cd tasktree
```

### 2. Setup Backend
```bash
cd server
npm install
```

- Create a `.env` file inside `/server` and add your environment variables:
  ```
  MONGO_URI=your_mongodb_connection_string
  PORT=5000
  ```

- Start Backend
  ```bash
  npm run dev
  ```

### 3. Setup Frontend
```bash
cd client
npm install
npm run dev
```

---

## 📌 API Endpoints (Backend)

| Method | Endpoint                                      | Description                   |
|--------|-----------------------------------------------|-------------------------------|
| POST   | `/sections`                                   | Create a new section          |
| POST   | `/sections/:sectionId/tasks`                  | Create a new task             |
| POST   | `/sections/:sectionId/tasks/:taskId/subtasks` | Add a subtask to a task       |
| PATCH  | `/sections/:sectionId/tasks/:taskId/subtasks/:subTaskId/done` | Mark subtask as done |
| GET    | `/sections`                                   | Get all sections with tasks   |

---

## 🎨 Screenshots

| 📋 Sections & Tasks |
|---------------------|
| _Add your screenshot here_ |

---

## 🤝 Contributing
Contributions, issues and feature requests are welcome!

1. Fork the repository
2. Create a new branch (`git checkout -b feature-name`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature-name`)
5. Create a Pull Request

---

## 📜 License
This project is **open-source** and available under the [MIT License](LICENSE).

---

## 🙌 Author
- **Ahmed Nady**
- GitHub: [@Ahmed-Nadyy](https://github.com/Ahmed-Nadyy)
- LinkedIn: [www.linkedin.com/in/ahmed-nadyy](https://www.linkedin.com/in/ahmed-nadyy)

