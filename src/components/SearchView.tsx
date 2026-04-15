import React, { useState } from "react";
import { Row, Col, Spinner, Container } from "react-bootstrap";
import { Recipe } from "../types";
import Preview from "./Preview";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { apiBaseUrl } from "../constants";

const SearchView: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searching, setSearching] = useState(true);
  const [searchParams] = useSearchParams();

  const terms = searchParams.get("terms");
  const queryType = searchParams.get("type");

  React.useEffect(() => {
    const searchRecipes = async () => {
      setSearching(true);
      if (!terms || !queryType) {
        setSearching(false);
        setRecipes([]);
        return;
      }
      const response = await axios.get<Recipe[]>(
        `${apiBaseUrl}/search?type=${queryType}&terms=${encodeURIComponent(terms)}`,
      );
      if (response) {
        setRecipes(response.data);
      }
      setSearching(false);
    };
    searchRecipes();
  }, [terms, queryType]);

  if (searching) {
    return (
      <Container style={{ marginTop: "20px" }}>
        <Spinner animation="border" />
      </Container>
    );
  }
  if (recipes.length === 0) {
    return (
      <div className="container" style={{ marginTop: "20px" }}>
        <h2>No recipes found. Try again?</h2>
      </div>
    );
  }
  return (
    <Container style={{ marginTop: "20px" }}>
      <Row xs={1} md={2} lg={3} className="g-4">
        {recipes.map((r: Recipe) => (
          <Col key={r.id}>
            <Preview recipe={r} />
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default SearchView;
