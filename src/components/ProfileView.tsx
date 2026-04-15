import React, { useState } from "react";
import { ListGroup } from "react-bootstrap";
import { User } from "../types";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { apiBaseUrl } from "../constants";

interface Props {
  loggedInUser: User | null | undefined;
}

const ProfileView: React.FC<Props> = ({ loggedInUser: _loggedInUser }: Props) => {
  const { username } = useParams<{ username: string }>();
  const [user, setUser] = useState<User | undefined>(undefined);

  React.useEffect(() => {
    const findLists = async () => {
      if (!username) {
        return;
      }
      const fullUser = await axios.get<User | undefined>(`${apiBaseUrl}/users/${username}`);
      if (fullUser) {
        setUser(fullUser.data);
      }
    };
    findLists();
  }, [username]);

  if (!user) {
    return <div>Profile</div>;
  }

  return (
    <div className="container">
      <div className="row">
        <div className="col align-self-end">
          <h3 className="mt-auto">{user.name}</h3>
        </div>
      </div>
      <div className="row">
        {user.lists?.map((l, index) =>
          l.recipes && l.recipes.length > 0 ? (
            <div style={{ margin: "20px" }} key={l.title + index}>
              <h4>{l.title}</h4>
              <ListGroup>
                {l.recipes?.map((r, rIndex) => (
                  <ListGroup.Item key={r.id + rIndex}>
                    <Link to={`/recipes/${r.id}`}>{r.title}</Link>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          ) : null,
        )}
      </div>
    </div>
  );
};

export default ProfileView;
