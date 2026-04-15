import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import axios from "axios";
import { apiBaseUrl } from "../constants";
import { useNavigate } from "react-router-dom";
import { User } from "../types";

interface Props {
  appLogin: (user: User | null) => void;
}

const LoginForm: React.FC<Props> = ({ appLogin }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<EventTarget>) => {
    event.preventDefault();
    event.stopPropagation();
    setError("");
    try {
      const response = await axios.post(`${apiBaseUrl}/login`, { email, password });
      const user: User = { ...response.data.user, token: response.data.token };
      window.localStorage.setItem("some-recipes-user-token", JSON.stringify(user));
      appLogin(user);
      setEmail("");
      setPassword("");
      navigate("/");
    } catch {
      setError("Invalid email or password");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "40px auto" }}>
      <div className="bg-body-tertiary rounded-3 p-4">
        <h2 className="text-center mb-4">Login</h2>
        {error && <div className="error">{error}</div>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Email address</Form.Label>
            <Form.Control
              type="text"
              required
              placeholder="abc@example.com"
              value={email}
              onChange={({ target }) => setEmail(target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="formBasicPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={({ target }) => setPassword(target.value)}
            />
          </Form.Group>
          <Button variant="primary" type="submit" className="w-100">
            Login
          </Button>
        </Form>
        <p className="text-center mt-3 mb-0" style={{ fontSize: "14px" }}>
          Don't have an account? <a href="/signup">Sign up</a>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
