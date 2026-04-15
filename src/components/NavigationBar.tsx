import React, { useState } from "react";
import { Button, Navbar, Nav, Form, FormControl } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { User } from "../types";

interface Props {
  user: User | null;
  logout: () => void;
  showNewModal: () => void;
}

const NavigationBar: React.FC<Props> = ({ user, logout, showNewModal }: Props) => {
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
    <Navbar expand="lg" bg="light">
      <div className="container">
        <Navbar.Brand href="/" style={{ flex: "1 1 0" }}>
          Some Recipes
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Form
            className="d-flex justify-content-center"
            style={{ flex: "1 1 0" }}
            onSubmit={searchRecipes}
          >
            <FormControl
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={({ target }) => setSearchTerm(target.value)}
            />
          </Form>
          <Nav style={{ flex: "1 1 0", justifyContent: "flex-end" }}>
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
                <Button title="Add new recipe" onClick={showNewModal} variant="outline-primary">
                  +
                </Button>
              </>
            ) : null}
          </Nav>
        </Navbar.Collapse>
      </div>
    </Navbar>
  );
};

export default NavigationBar;
