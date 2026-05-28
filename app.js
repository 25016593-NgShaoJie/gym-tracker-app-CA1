const express = require("express");
const app = express();
const PORT = 3000;

app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// storage
let workouts = [];

let nextId = 1;

const WORKOUT_TYPES = [
    "Strength",
    "Cardio",
    "HIIT",
    "Flexibility",
    "Sports",
    "CrossFit"
];

// index.ejs
app.get("/", (req, res) => {
    const totalCalories = workouts.reduce(
        (sum, w) => sum + Number(w.calories),
        0
    );
    const totalMinutes = workouts.reduce(
        (sum, w) => sum + Number(w.duration),
        0
    );
    const avgRating = workouts.length
        ? (
              workouts.reduce((sum, w) => sum + Number(w.rating), 0) /
              workouts.length
          ).toFixed(1)
        : 0;
    const recent = [...workouts]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);
    res.render("index", {
        workouts,
        totalCalories,
        totalMinutes,
        avgRating,
        recent,
        WORKOUT_TYPES
    });
});

// Views all workouts
app.get("/workouts", (req, res) => {
    const {
        search = "",
        type = "",
        sort = "date-desc",
        favourites = ""
    } = req.query;

    let filtered = [...workouts];

    if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
            (w) =>
                w.name.toLowerCase().includes(q) ||
                w.exercises.toLowerCase().includes(q) ||
                w.notes.toLowerCase().includes(q)
        );
    }

    if (type) filtered = filtered.filter((w) => w.type === type);
    if (favourites === "true") filtered = filtered.filter((w) => w.favourite);

    if (sort === "date-desc")
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    else if (sort === "date-asc")
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    else if (sort === "rating-desc")
        filtered.sort((a, b) => b.rating - a.rating);
    else if (sort === "duration-desc")
        filtered.sort((a, b) => b.duration - a.duration);
    else if (sort === "calories-desc")
        filtered.sort((a, b) => b.calories - a.calories);

    res.render("workouts", {
        workouts: filtered,
        search,
        type,
        sort,
        favourites,
        WORKOUT_TYPES
    });
});

// ─── DETAILS ─────────────────────────────────────────────────────────────────
app.get("/workouts/:id", (req, res) => {
    const workout = workouts.find((w) => w.id === parseInt(req.params.id));
    if (!workout) return res.redirect("/workouts");
    res.render("detail", { workout });
});

// ─── ADD FORM ─────────────────────────────────────────────────────────────────
app.get("/add", (req, res) => {
    res.render("add", { WORKOUT_TYPES, error: null });
});

app.post("/add", (req, res) => {
    const {
        name,
        date,
        type,
        duration,
        exercises,
        intensity,
        calories,
        notes,
        rating
    } = req.body;
    if (!name || !date || !type || !duration || !exercises) {
        return res.render("add", {
            WORKOUT_TYPES,
            error: "Please fill in all required fields."
        });
    }
    workouts.push({
        id: nextId++,
        name: name.trim(),
        date,
        type,
        duration: parseInt(duration),
        exercises: exercises.trim(),
        intensity: parseInt(intensity) || 3,
        calories: parseInt(calories) || 0,
        notes: notes ? notes.trim() : "",
        favourite: false,
        rating: parseInt(rating) || 3
    });
    res.redirect("/workouts");
});

// ─── EDIT FORM ────────────────────────────────────────────────────────────────
app.get("/edit/:id", (req, res) => {
    const workout = workouts.find((w) => w.id === parseInt(req.params.id));
    if (!workout) return res.redirect("/workouts");
    res.render("edit", { workout, WORKOUT_TYPES, error: null });
});

app.post("/edit/:id", (req, res) => {
    const {
        name,
        date,
        type,
        duration,
        exercises,
        intensity,
        calories,
        notes,
        rating
    } = req.body;
    const idx = workouts.findIndex((w) => w.id === parseInt(req.params.id));
    if (idx === -1) return res.redirect("/workouts");
    if (!name || !date || !type || !duration || !exercises) {
        return res.render("edit", {
            workout: workouts[idx],
            WORKOUT_TYPES,
            error: "Please fill in all required fields."
        });
    }
    workouts[idx] = {
        ...workouts[idx],
        name: name.trim(),
        date,
        type,
        duration: parseInt(duration),
        exercises: exercises.trim(),
        intensity: parseInt(intensity) || 3,
        calories: parseInt(calories) || 0,
        notes: notes ? notes.trim() : "",
        rating: parseInt(rating) || 3
    };
    res.redirect(`/workouts/${workouts[idx].id}`);
});

// ─── DELETE ───────────────────────────────────────────────────────────────────
app.post("/delete/:id", (req, res) => {
    workouts = workouts.filter((w) => w.id !== parseInt(req.params.id));
    res.redirect("/workouts");
});

// ─── TOGGLE FAVOURITE ─────────────────────────────────────────────────────────
app.post("/favourite/:id", (req, res) => {
    const workout = workouts.find((w) => w.id === parseInt(req.params.id));
    if (workout) workout.favourite = !workout.favourite;
    const ref = req.headers.referer || "/workouts";
    res.redirect(ref);
});

app.listen(PORT, () =>
    console.log(`Gym Tracker running at http://localhost:${PORT}`)
);
