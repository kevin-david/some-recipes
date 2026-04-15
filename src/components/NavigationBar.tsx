import React, { useState } from "react";
import { Navbar, Nav, Form, FormControl } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { User } from "../types";

interface Props {
  user: User | null;
  logout: () => void;
  showNewModal: () => void;
  themeMode: string;
  cycleTheme: () => void;
}

const themeIcon: Record<string, string> = {
  light: "\u2600",
  dark: "\u263E",
  system: "\uD83D\uDCBB",
};

const NavigationBar: React.FC<Props> = ({
  user,
  logout,
  showNewModal,
  themeMode,
  cycleTheme,
}: Props) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const location = useLocation();

  const hideLoggedIn = user !== null ? { display: "none" } : undefined;

  const searchRecipes = (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();
    if (!searchTerm.trim()) {
      return;
    }
    navigate(`/search?type=title&terms=${encodeURIComponent(searchTerm.trim())}`);
  };

  const navLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <Navbar expand="lg" bg="body-tertiary">
      <div className="container">
        <Navbar.Brand href="/" style={{ flex: "1 1 0" }}>
          Some Recipes
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="align-items-center">
          <Form
            className="d-flex justify-content-center mt-2 mt-lg-0"
            style={{ flex: "1 1 0" }}
            onSubmit={searchRecipes}
          >
            <FormControl
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={({ target }) => setSearchTerm(target.value)}
              style={{ height: "36px" }}
            />
          </Form>
          <Nav style={{ flex: "1 1 0", justifyContent: "flex-end", alignItems: "center" }}>
            <Nav.Link href="/" active={location.pathname === "/"}>
              Home
            </Nav.Link>
            <Nav.Link href="/signup" style={hideLoggedIn} active={location.pathname === "/signup"}>
              Sign Up
            </Nav.Link>
            <Nav.Link href="/login" style={hideLoggedIn} active={location.pathname === "/login"}>
              Login
            </Nav.Link>
            {user ? (
              <>
                <Nav.Link href={`/profile/${user.username}`}>Profile</Nav.Link>
                <Nav.Link onClick={navLogout}>Logout</Nav.Link>
                <Nav.Link onClick={showNewModal} className="nav-icon-btn nav-icon-btn-primary">
                  <span className="nav-icon-btn-icon">+</span>
                  <span className="nav-icon-btn-label">Add Recipe</span>
                </Nav.Link>
              </>
            ) : null}
            <Nav.Link onClick={cycleTheme} title={`Theme: ${themeMode}`} className="nav-icon-btn">
              <span className="nav-icon-btn-icon">{themeIcon[themeMode] || themeIcon.system}</span>
              <span className="nav-icon-btn-label">
                {themeMode === "system" ? "System" : themeMode === "dark" ? "Dark" : "Light"}
              </span>
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </div>
    </Navbar>
  );
};

export default NavigationBar;
