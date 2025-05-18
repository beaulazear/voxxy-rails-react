# Voxxy 🧠✨

**Voxxy** is a simple tool to help friends make plans together — without the endless back-and-forth. Whether you're organizing a weekend trip, dinner party, or casual hangout, Voxxy makes it easier to choose a time and place that works for everyone.

---

## 🚀 What You Can Do

- Create shared boards for group plans  
- Invite friends by email  
- Collect availability and confirm details  
- Use AI to help with planning ideas  
- See responses and participation at a glance  
- Use it easily on both desktop and mobile

---

## 👥 Who It's For

Voxxy is for anyone who’s ever tried to make a group plan and felt overwhelmed:

- Friend groups  
- Roommates  
- Small teams  
- Anyone tired of group chats that go nowhere  

---

## 🛠 Getting Started (for developers)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/voxxy.git
cd voxxy
```

### 2. Set up the Rails API

```bash
bundle install
rails db:create db:migrate
```

Create a `.env` file and add your keys:

```
SENDGRID_API_KEY=your_sendgrid_key
OPENAI_API_KEY=your_openai_key
```

Then start the server:

```bash
rails s -p 3001
```

### 3. Set up the React frontend

```bash
cd client
npm install
npm start
```

Make sure your frontend points to the correct backend URL (`localhost:3000` for development).

---

## 📁 Project Layout

```
voxxy/
├── app/
│   ├── controllers/
│   ├── models/
│   ├── services/
│   └── mailers/
├── client/         # React app lives here
│   ├── src/
│   └── public/
├── config/
├── db/
└── README.md
```

---

## 🔧 Tech Stack

### Backend:
- Ruby on Rails (API only)
- PostgreSQL
- SendGrid
- OpenAI API
- Redis

### Frontend:
- React.js
- Styled Components
- React Router
- Lucide Icons
- Mixpanel (for tracking)
- Expo (React Native in progress)

---

## 📄 License

This project is under the [MIT License](https://opensource.org/licenses/MIT). Feel free to use, fork, or build on it.

---

## 🤝 Contributing

Open to pull requests! If you'd like to help:

1. Fork this repo  
2. Make a new branch  
3. Add your changes  
4. Open a pull request  

Please keep code readable, follow Rails/React conventions, and include comments where needed.

---

## 📬 Contact

Questions, ideas, or just want to connect?  
📧 **team@voxxyai.com**

Thanks for checking out Voxxy!