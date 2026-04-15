import React, { useState } from "react";
import axios from "axios";
import { apiBaseUrl } from "./constants";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RecipeView from "./components/RecipeView";
import RecipeList from "./components/RecipeList";
import NavigationBar from "./components/NavigationBar";
import SignUpForm from "./components/SignUpForm";
import LoginForm from "./components/LoginForm";
import SearchView from "./components/SearchView";
import ProfileView from "./components/ProfileView";
import NewRecipe from "./components/NewRecipe";
import { User } from "./types";
import { Button } from "react-bootstrap";

type ThemeMode = "light" | "dark" | "system";

function resolveTheme(mode: ThemeMode) {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

function useTheme() {
  const saved = (localStorage.getItem("some-recipes-theme") as ThemeMode) || "system";
  const [mode, setMode] = useState<ThemeMode>(saved);
  const [resolved, setResolved] = useState(resolveTheme(saved));

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (mode === "system") {
        setResolved(mq.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  React.useEffect(() => {
    setResolved(resolveTheme(mode));
    document.documentElement.setAttribute("data-bs-theme", resolveTheme(mode));
  }, [mode]);

  const cycleTheme = () => {
    const order: ThemeMode[] = ["light", "dark", "system"];
    const next = order[(order.indexOf(mode) + 1) % order.length];
    setMode(next);
    localStorage.setItem("some-recipes-theme", next);
  };

  return { theme: resolved, mode, cycleTheme };
}

const App: React.FC = () => {
  const { theme, mode, cycleTheme } = useTheme();
  const [recipeList, setRecipeList] = useState(null);
  // Seed from localStorage synchronously to avoid flash of logged-out UI
  const savedToken = localStorage.getItem("some-recipes-user-token");
  const savedUser = savedToken ? (JSON.parse(savedToken) as User) : null;
  const [user, setUser] = useState<User | null>(savedUser);
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const grabUser = async (username: string, token?: string) => {
    const response = await axios.get(`${apiBaseUrl}/users/${username}`);
    const newUser = { ...response.data, token };
    setUser(newUser);
  };

  React.useEffect(() => {
    try {
      navigator.wakeLock?.request("screen");
    } catch {
      console.log("Wakelock not supported");
    }
  }, []);

  React.useEffect(() => {
    const token = localStorage.getItem("some-recipes-user-token");
    if (token) {
      const parsedUser = JSON.parse(token);
      if (parsedUser) {
        grabUser(parsedUser.username, parsedUser.token);
      }
    }
  }, []);

  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  const appLogin = (user: User | null) => {
    setUser(user);
  };

  React.useEffect(() => {
    const getRecipes = async () => {
      const data = await axios.get(`${apiBaseUrl}/recipes`);
      setRecipeList(data.data);
    };
    getRecipes();
  }, []);

  return (
    <div>
      <Router>
        <NavigationBar
          user={user}
          logout={logout}
          showNewModal={handleShow}
          themeMode={mode}
          cycleTheme={cycleTheme}
        />
        <div className="container" style={{ marginTop: "20px" }}>
          <Routes>
            <Route path="/recipes/:id" element={<RecipeView loggedInUser={user} />} />
            <Route path="/recipes" element={<RecipeList recipes={recipeList} />} />
            <Route path="/login" element={<LoginForm appLogin={appLogin} />} />
            <Route path="/signup" element={<SignUpForm appLogin={appLogin} />} />
            <Route path="/search" element={<SearchView />} />
            <Route path="/profile/:username" element={<ProfileView loggedInUser={user} />} />
            <Route
              path="/"
              element={
                <>
                  {user ? null : (
                    <div className="p-5 mb-4 bg-body-tertiary rounded-3">
                      <h1>No more annoying ads or long blog posts</h1>
                      <h2>Just some recipes</h2>
                      <p>
                        Keep all of the recipes you love in one place. Import from across the web or
                        upload your own and come back to this simple site when you are ready to make
                        them.
                      </p>
                      <p>Sign up or login and click the + button to add your own recipes.</p>
                      <p>
                        <Button variant="primary" href="/signup">
                          Sign up
                        </Button>
                        {"   "}
                        <Button variant="outline-primary" href="/login">
                          Login
                        </Button>
                      </p>
                    </div>
                  )}
                  <RecipeList recipes={recipeList} />
                </>
              }
            />
          </Routes>
          <NewRecipe
            show={show}
            handleClose={handleClose}
            handleShow={handleShow}
            loggedInUser={user}
          />
        </div>
        <footer style={{ textAlign: "center", padding: "20px", color: "#ccc", fontSize: "12px" }}>
          Version {__GIT_HASH__}
        </footer>
      </Router>
    </div>
  );
};

export default App;
