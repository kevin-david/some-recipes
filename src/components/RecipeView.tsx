import React, { useState } from "react";
import { Recipe, User } from "../types";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { apiBaseUrl } from "../constants";
import { Badge, Button } from "react-bootstrap";
import NewRecipe from "./NewRecipe";

interface Props {
  loggedInUser?: User | null | undefined;
}

const RecipeView: React.FC<Props> = ({ loggedInUser }: Props) => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [canEdit, setCanEdit] = useState<boolean>(false);
  const [showModal, setShowModal] = useState(false);
  const [wasCopied, setWasCopied] = useState(false);
  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  React.useEffect(() => {
    const getRecipe = async () => {
      const response = await axios.get<Recipe>(`${apiBaseUrl}/recipes/${id}`);
      if (response.data) {
        setRecipe(response.data);
        if (response.data.user?.id && loggedInUser?.id === response.data.user.id) {
          setCanEdit(true);
        }
      }
    };
    getRecipe();
  }, [id, loggedInUser]);

  React.useEffect(() => {
    if (recipe) {
      const isDev =
        window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const prefix = isDev ? "[DEV] " : "";
      document.title = `${prefix}${recipe.title} — Some Recipes`;
    }
    return () => {
      const isDev =
        window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      document.title = isDev ? "[DEV] Some Recipes" : "Some Recipes";
    };
  }, [recipe]);

  React.useEffect(() => {
    const favList = loggedInUser?.lists.find((l) => l.title === "Favorites");
    if (favList) {
      if (favList.recipes.find((r) => r.id === id)) {
        setIsSaved(true);
      }
    }
  }, [loggedInUser, id]);

  const saveRecipe = async () => {
    const list = loggedInUser?.lists.find((l) => l.title === "Favorites");
    if (!list) {
      return;
    }
    let updatedRecipes;
    if (isSaved) {
      updatedRecipes = list.recipes.filter((r) => r.id !== recipe?.id);
    } else if (recipe) {
      updatedRecipes = [...list.recipes, recipe];
    } else {
      return;
    }
    const response = await axios.put(
      `${apiBaseUrl}/lists/${list.id}`,
      { ...list, recipes: updatedRecipes },
      { headers: { Authorization: "Bearer " + loggedInUser?.token } },
    );
    if (response.status === 200) {
      setIsSaved(!isSaved);
    }
  };

  const copyToClipboard = () => {
    if (recipe) {
      navigator.clipboard.writeText(recipe.ingredients.join("\r\n"));
      setWasCopied(true);
    }
  };

  const deleteRecipe = async () => {
    const windowRes = window.confirm("Are you sure you want to delete this recipe?");
    if (windowRes) {
      const response = await axios.delete(`${apiBaseUrl}/recipes/${id}`, {
        headers: { Authorization: "Bearer " + loggedInUser?.token },
      });
      if (response.status === 200) {
        navigate("/");
      }
    }
  };

  if (!recipe) {
    return null;
  }

  return (
    <div style={{ margin: "20px" }}>
      <h2>
        {recipe.title}
        {recipe.link ? (
          <a
            target="_blank"
            title="open in new tab"
            style={{ paddingLeft: "5px" }}
            rel="noopener noreferrer"
            href={recipe.link}
          >
            &#x2197;
          </a>
        ) : null}
      </h2>
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "12px" }}>
        {loggedInUser ? (
          <Button
            size="sm"
            variant="outline-secondary"
            title="Save to favorites"
            onClick={saveRecipe}
            style={{ minWidth: "90px" }}
          >
            {isSaved ? "❤️ Saved" : "🤍 Save"}
          </Button>
        ) : null}
        {canEdit ? (
          <>
            <Button size="sm" variant="outline-secondary" title="Edit recipe" onClick={handleShow}>
              Edit
            </Button>
            <Button size="sm" variant="outline-danger" title="Delete recipe" onClick={deleteRecipe}>
              Delete
            </Button>
          </>
        ) : null}
      </div>
      {recipe.tags && recipe.tags.length > 0 ? (
        <div style={{ marginBottom: "12px" }}>
          Tags:{" "}
          {recipe.tags.map((t, index) => (
            <Badge
              className="ms-1"
              bg="body-tertiary"
              text="body"
              key={t + index}
              style={{ fontSize: "14px", padding: "6px 10px" }}
            >
              <Link to={`/search?type=tag&terms=${t}`}>{t}</Link>
            </Badge>
          ))}
        </div>
      ) : null}
      {recipe.user ? (
        <div>
          Added by: <a href={`/profile/${recipe.user.username}`}>{recipe.user.name}</a>
        </div>
      ) : null}
      <br />
      <p>{recipe.description}</p>
      <br />
      {recipe.imageURL ? (
        <div style={{ marginBottom: "20px" }}>
          <img
            src={recipe.imageURL}
            alt={recipe.title}
            style={{ width: "100%", maxWidth: "500px", height: "auto" }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      ) : null}
      <h4>
        Ingredients{" "}
        <Button
          variant="outline-secondary"
          size="sm"
          title={wasCopied ? "Copied!" : "Copy to clipboard"}
          onClick={copyToClipboard}
        >
          {wasCopied ? "\u2705" : "\ud83d\udccb"}
        </Button>
      </h4>
      <ul>
        {recipe.ingredients.map((i, index) => (
          <li key={i + index}>{i}</li>
        ))}
      </ul>
      <h4>Directions</h4>
      <ol>
        {recipe.directions.map((d, index) => (
          <li key={d + index}>{d}</li>
        ))}
      </ol>
      {recipe.notes && recipe.notes.length > 0 ? (
        <div>
          <h4>Notes</h4>
          <ul>
            {recipe.notes.map((n: string) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <NewRecipe
        show={showModal}
        handleClose={handleClose}
        handleShow={handleShow}
        loggedInUser={loggedInUser}
        recipe={recipe}
        setRecipe={setRecipe}
      />
    </div>
  );
};

export default RecipeView;
