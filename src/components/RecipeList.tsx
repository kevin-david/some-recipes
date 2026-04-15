import React from "react";
import { Row, Col } from "react-bootstrap";
import { Recipe } from "../types";
import Preview from "./Preview";

const RecipeList: React.FC<{ recipes: Recipe[] | null }> = ({ recipes }) => {
  return (
    <Row xs={1} md={2} lg={3} className="g-4" style={{ margin: "20px" }}>
      {recipes?.map((r: Recipe) => (
        <Col key={r.id}>
          <Preview recipe={r} />
        </Col>
      ))}
    </Row>
  );
};

export default RecipeList;
