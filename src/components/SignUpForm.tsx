import React, { useState, useRef, useEffect } from "react";
import { Form, Button, Col, InputGroup, Row } from "react-bootstrap";
import axios from "axios";
import { apiBaseUrl } from "../constants";
import { User } from "../types";
import { useNavigate } from "react-router-dom";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: { sitekey: string; theme?: string; callback: (token: string) => void },
      ) => string;
      reset: (id: string) => void;
    };
  }
}

interface Props {
  appLogin: (user: User) => void;
}

const SignUpForm: React.FC<Props> = ({ appLogin }: Props) => {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [siteKey, setSiteKey] = useState("");
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    axios.get(`${apiBaseUrl}/config`).then((res) => {
      if (!cancelled && res.data.turnstileSiteKey) {
        setSiteKey(res.data.turnstileSiteKey);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!siteKey || widgetIdRef.current) {
      return;
    }
    const script = document.createElement("script");
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit";
    script.async = true;
    const ready = new Promise<void>((resolve) => {
      (window as unknown as Record<string, unknown>).onTurnstileLoad = resolve;
    });
    document.head.appendChild(script);

    let cancelled = false;
    ready.then(() => {
      if (!cancelled && window.turnstile && turnstileRef.current && !widgetIdRef.current) {
        const isDark = document.documentElement.getAttribute("data-bs-theme") === "dark";
        widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey: siteKey,
          theme: isDark ? "dark" : "light",
          callback: (token: string) => setTurnstileToken(token),
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [siteKey]);

  const handleSubmit = async (event: React.FormEvent<EventTarget>) => {
    const form = event.currentTarget as HTMLInputElement;
    event.preventDefault();
    event.stopPropagation();
    setError("");

    if (form.checkValidity() === false) {
      return;
    }
    if (siteKey && !turnstileToken) {
      setError("Please complete the CAPTCHA");
      return;
    }

    try {
      await axios.post(`${apiBaseUrl}/users`, {
        username,
        email,
        name: `${firstName} ${lastName}`,
        lists: [],
        password,
        turnstileToken,
      });
      const response = await axios.post(`${apiBaseUrl}/login`, { email, password });
      if (response.data) {
        const user: User = { ...response.data.user, token: response.data.token };
        window.localStorage.setItem("some-recipes-user-token", JSON.stringify(user));
        appLogin(user);
      }
      navigate("/");
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response?.data?.error) {
        setError(e.response.data.error);
      } else {
        setError("Sign up failed");
      }
      // Reset turnstile for retry
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.reset(widgetIdRef.current);
        setTurnstileToken("");
      }
    }
  };

  return (
    <div style={{ maxWidth: "450px", margin: "40px auto" }}>
      <div className="bg-body-tertiary rounded-3 p-4">
        <h2 className="text-center mb-4">Sign up</h2>
        {error && <div className="error">{error}</div>}
        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col>
              <Form.Group>
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  required
                  placeholder="John"
                  value={firstName}
                  onChange={({ target }) => setFirstName(target.value)}
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  required
                  type="text"
                  placeholder="Smith"
                  value={lastName}
                  onChange={({ target }) => setLastName(target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3" controlId="formBasicEmail">
            <Form.Label>Email address</Form.Label>
            <Form.Control
              type="email"
              required
              placeholder="Enter email"
              value={email}
              onChange={({ target }) => setEmail(target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3" controlId="validationCustomUsername">
            <Form.Label>Username</Form.Label>
            <InputGroup>
              <InputGroup.Text>@</InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Username"
                required
                value={username}
                onChange={({ target }) => setUsername(target.value)}
              />
            </InputGroup>
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
          <div
            ref={turnstileRef}
            style={{ margin: "15px 0", display: "flex", justifyContent: "center" }}
          />
          <Button variant="primary" type="submit" className="w-100">
            Sign up
          </Button>
        </Form>
        <p className="text-center mt-3 mb-0" style={{ fontSize: "14px" }}>
          Already have an account? <a href="/login">Login</a>
        </p>
      </div>
    </div>
  );
};

export default SignUpForm;
