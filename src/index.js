// import bcrypt from "bcryptjs";
// import express from "express";
// import cors from "cors";
// import jwt from "jsonwebtoken";
// import dotenv from "dotenv";
// import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

// dotenv.config();

// const app = express();
// const port = process.env.PORT || 5000;
// const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
// const jwtSecret = process.env.JWT_SECRET;
// const mongoUri = process.env.MONGODB_URI;
// const dbName = process.env.DB_NAME || "ideavault";

// if (!jwtSecret) {
//   console.warn("Missing JWT_SECRET in environment variables.");
// }

// if (!mongoUri) {
//   console.warn("Missing MONGODB_URI in environment variables.");
// }

// app.use(
//   cors({
//     origin: [clientOrigin, "http://localhost:5173", "http://localhost:4173"],
//     credentials: true,
//   })
// );
// app.use(express.json());
// app.get("/", (req, res) => {
//   res.send({
//     name: "IdeaVault API",
//     status: "running",
//     message: "Startup idea sharing platform server is live.",
//   });
// });

// const client = new MongoClient(mongoUri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: false,
//     deprecationErrors: true,
//   },
// });

// let ideasCollection;
// let commentsCollection;
// let usersCollection;

// const isValidObjectId = (id) => ObjectId.isValid(id) && String(new ObjectId(id)) === id;

// const verifyToken = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader || !authHeader.startsWith("Bearer ")) {
//     return res.status(401).send({ message: "Unauthorized access" });
//   }

//   const token = authHeader.split(" ")[1];

//   jwt.verify(token, jwtSecret, (error, decoded) => {
//     if (error) {
//       return res.status(403).send({ message: "Forbidden access" });
//     }
//     req.decoded = decoded;
//     next();
//   });
// };

// const verifyEmailOwner = (req, res, next) => {
//   const email = req.query.email || req.body.email || req.body.authorEmail || req.body.userEmail;
//   if (!email || req.decoded.email !== email) {
//     return res.status(403).send({ message: "Forbidden access" });
//   }
//   next();
// };

// const buildIdeaQuery = (query) => {
//   const filter = {};

//   if (query.search) {
//     filter.title = { $regex: query.search, $options: "i" };
//   }

//   if (query.category && query.category !== "All") {
//     filter.category = query.category;
//   }

//   if (query.from || query.to) {
//     filter.createdAt = {};
//     if (query.from) {
//       const fromDate = new Date(query.from);
//       fromDate.setHours(0, 0, 0, 0);
//       filter.createdAt.$gte = fromDate.toISOString();
//     }
//     if (query.to) {
//       const toDate = new Date(query.to);
//       toDate.setHours(23, 59, 59, 999);
//       filter.createdAt.$lte = toDate.toISOString();
//     }
//   }

//   return filter;
// };

// async function run() {
//   await client.connect();
//   const db = client.db(dbName);
//   ideasCollection = db.collection("ideas");
//   commentsCollection = db.collection("comments");
//   usersCollection = db.collection("users");

//   await ideasCollection.createIndex({ title: "text", category: 1, authorEmail: 1, createdAt: -1 });
//   await commentsCollection.createIndex({ ideaId: 1, userEmail: 1, createdAt: -1 });
//   await usersCollection.createIndex({ email: 1 }, { unique: true });

//   app.get("/", (req, res) => {
//     res.send({
//       name: "IdeaVault API",
//       status: "running",
//       message: "Startup idea sharing platform server is live.",
//     });
//   });

//   app.post("/jwt", async (req, res) => {
//     const { email, name, photoURL } = req.body;

//     if (!email) {
//       return res.status(400).send({ message: "Email is required" });
//     }

//     await usersCollection.updateOne(
//       { email },
//       {
//         $set: {
//           email,
//           name: name || "IdeaVault User",
//           photoURL: photoURL || "",
//           lastLoginAt: new Date().toISOString(),
//         },
//         $setOnInsert: {
//           createdAt: new Date().toISOString(),
//         },
//       },
//       { upsert: true }
//     );

//     const token = jwt.sign({ email }, jwtSecret, { expiresIn: "7d" });
//     res.send({ token });
//   });

//   app.get("/ideas", async (req, res) => {
//     const filter = buildIdeaQuery(req.query);
//     const limit = Math.min(Number(req.query.limit) || 0, 50);
//     const sort = req.query.sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

//     const pipeline = [
//       { $match: filter },
//       {
//         $lookup: {
//           from: "comments",
//           let: { ideaId: { $toString: "$_id" } },
//           pipeline: [{ $match: { $expr: { $eq: ["$ideaId", "$$ideaId"] } } }],
//           as: "comments",
//         },
//       },
//       {
//         $addFields: {
//           commentsCount: { $size: "$comments" },
//           trendingScore: {
//             $add: [{ $multiply: [{ $size: "$comments" }, 3] }, { $ifNull: ["$views", 0] }],
//           },
//         },
//       },
//       { $project: { comments: 0 } },
//       req.query.sort === "trending"
//         ? { $sort: { trendingScore: -1, createdAt: -1 } }
//         : { $sort: sort },
//     ];

//     if (limit > 0) pipeline.push({ $limit: limit });

//     const ideas = await ideasCollection.aggregate(pipeline).toArray();
//     res.send(ideas);
//   });

//   app.get("/ideas/:id", verifyToken, async (req, res) => {
//     const { id } = req.params;
//     if (!isValidObjectId(id)) return res.status(400).send({ message: "Invalid idea id" });

//     await ideasCollection.updateOne({ _id: new ObjectId(id) }, { $inc: { views: 1 } });
//     const idea = await ideasCollection.findOne({ _id: new ObjectId(id) });

//     if (!idea) return res.status(404).send({ message: "Idea not found" });
//     res.send(idea);
//   });

//   app.post("/ideas", verifyToken, verifyEmailOwner, async (req, res) => {
//     const idea = req.body;

//     const requiredFields = [
//       "title",
//       "shortDescription",
//       "detailedDescription",
//       "category",
//       "imageURL",
//       "targetAudience",
//       "problemStatement",
//       "proposedSolution",
//       "authorEmail",
//     ];

//     const missingField = requiredFields.find((field) => !idea[field]);
//     if (missingField) {
//       return res.status(400).send({ message: `${missingField} is required` });
//     }

//     const newIdea = {
//       ...idea,
//       tags: Array.isArray(idea.tags) ? idea.tags : [],
//       estimatedBudget: idea.estimatedBudget || "Not specified",
//       views: 0,
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     };

//     const result = await ideasCollection.insertOne(newIdea);
//     res.status(201).send(result);
//   });

//   app.patch("/ideas/:id", verifyToken, async (req, res) => {
//     const { id } = req.params;
//     if (!isValidObjectId(id)) return res.status(400).send({ message: "Invalid idea id" });

//     const existing = await ideasCollection.findOne({ _id: new ObjectId(id) });
//     if (!existing) return res.status(404).send({ message: "Idea not found" });
//     if (existing.authorEmail !== req.decoded.email) {
//       return res.status(403).send({ message: "Only the author can update this idea" });
//     }

//     const allowedFields = [
//       "title",
//       "shortDescription",
//       "detailedDescription",
//       "category",
//       "tags",
//       "imageURL",
//       "estimatedBudget",
//       "targetAudience",
//       "problemStatement",
//       "proposedSolution",
//     ];

//     const updateDoc = {};
//     allowedFields.forEach((field) => {
//       if (req.body[field] !== undefined) updateDoc[field] = req.body[field];
//     });
//     updateDoc.updatedAt = new Date().toISOString();

//     const result = await ideasCollection.updateOne({ _id: new ObjectId(id) }, { $set: updateDoc });
//     res.send(result);
//   });

//   app.delete("/ideas/:id", verifyToken, async (req, res) => {
//     const { id } = req.params;
//     if (!isValidObjectId(id)) return res.status(400).send({ message: "Invalid idea id" });

//     const existing = await ideasCollection.findOne({ _id: new ObjectId(id) });
//     if (!existing) return res.status(404).send({ message: "Idea not found" });
//     if (existing.authorEmail !== req.decoded.email) {
//       return res.status(403).send({ message: "Only the author can delete this idea" });
//     }

//     const result = await ideasCollection.deleteOne({ _id: new ObjectId(id) });
//     await commentsCollection.deleteMany({ ideaId: id });
//     res.send(result);
//   });

//   app.get("/my-ideas", verifyToken, verifyEmailOwner, async (req, res) => {
//     const ideas = await ideasCollection
//       .find({ authorEmail: req.query.email })
//       .sort({ createdAt: -1 })
//       .toArray();
//     res.send(ideas);
//   });

//   app.get("/comments/idea/:ideaId", verifyToken, async (req, res) => {
//     const comments = await commentsCollection
//       .find({ ideaId: req.params.ideaId })
//       .sort({ createdAt: -1 })
//       .toArray();
//     res.send(comments);
//   });

//   app.post("/comments", verifyToken, verifyEmailOwner, async (req, res) => {
//     const { ideaId, ideaTitle, userName, userEmail, userPhoto, commentText } = req.body;

//     if (!ideaId || !commentText || !userEmail) {
//       return res.status(400).send({ message: "Idea id, comment text, and user email are required" });
//     }

//     const comment = {
//       ideaId,
//       ideaTitle: ideaTitle || "Startup Idea",
//       userName: userName || "IdeaVault User",
//       userEmail,
//       userPhoto: userPhoto || "",
//       commentText,
//       createdAt: new Date().toISOString(),
//       updatedAt: new Date().toISOString(),
//     };

//     const result = await commentsCollection.insertOne(comment);
//     res.status(201).send(result);
//   });

//   app.patch("/comments/:id", verifyToken, async (req, res) => {
//     const { id } = req.params;
//     if (!isValidObjectId(id)) return res.status(400).send({ message: "Invalid comment id" });

//     const existing = await commentsCollection.findOne({ _id: new ObjectId(id) });
//     if (!existing) return res.status(404).send({ message: "Comment not found" });
//     if (existing.userEmail !== req.decoded.email) {
//       return res.status(403).send({ message: "Only the comment owner can update this comment" });
//     }

//     const result = await commentsCollection.updateOne(
//       { _id: new ObjectId(id) },
//       {
//         $set: {
//           commentText: req.body.commentText,
//           updatedAt: new Date().toISOString(),
//         },
//       }
//     );
//     res.send(result);
//   });

//   app.delete("/comments/:id", verifyToken, async (req, res) => {
//     const { id } = req.params;
//     if (!isValidObjectId(id)) return res.status(400).send({ message: "Invalid comment id" });

//     const existing = await commentsCollection.findOne({ _id: new ObjectId(id) });
//     if (!existing) return res.status(404).send({ message: "Comment not found" });
//     if (existing.userEmail !== req.decoded.email) {
//       return res.status(403).send({ message: "Only the comment owner can delete this comment" });
//     }

//     const result = await commentsCollection.deleteOne({ _id: new ObjectId(id) });
//     res.send(result);
//   });

//   app.get("/my-interactions", verifyToken, verifyEmailOwner, async (req, res) => {
//     const comments = await commentsCollection
//       .find({ userEmail: req.query.email })
//       .sort({ createdAt: -1 })
//       .toArray();
//     res.send(comments);
//   });

//   app.use((req, res) => {
//     res.status(404).send({ message: "API route not found" });
//   });

//   if (!process.env.VERCEL) {
//     app.listen(port, () => {
//       console.log(`IdeaVault server running on port ${port}`);
//     });
//   }
// }



// export const ready = run().catch((error) => {
//   console.error("Server startup error:", error);
//   throw error;
// });

// export default app;

import bcrypt from "bcryptjs";
import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

dotenv.config();

const app = express();

const port = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
const jwtSecret = process.env.JWT_SECRET;
const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || "ideavault";

if (!jwtSecret) {
  console.warn("Missing JWT_SECRET in environment variables.");
}

if (!mongoUri) {
  console.warn("Missing MONGODB_URI in environment variables.");
}

app.use(
  cors({
    origin: [
      clientOrigin,
      "http://localhost:5173",
      "http://localhost:4173",
    ],
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send({
    name: "IdeaVault API",
    status: "running",
    message: "Startup idea sharing platform server is live.",
  });
});

const client = new MongoClient(mongoUri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  },
});

let ideasCollection;
let commentsCollection;
let usersCollection;

const isValidObjectId = (id) =>
  ObjectId.isValid(id) && String(new ObjectId(id)) === id;

const verifyToken = (req, res, next) => {
  if (!jwtSecret) {
    return res.status(500).send({
      message: "JWT_SECRET is missing",
    });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({
      message: "Unauthorized access",
    });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, jwtSecret, (error, decoded) => {
    if (error) {
      return res.status(403).send({
        message: "Forbidden access",
      });
    }

    req.decoded = decoded;
    next();
  });
};

const verifyEmailOwner = (req, res, next) => {
  const email =
    req.query.email ||
    req.body.email ||
    req.body.authorEmail ||
    req.body.userEmail;

  if (!email || req.decoded.email !== email) {
    return res.status(403).send({
      message: "Forbidden access",
    });
  }

  next();
};

const buildIdeaQuery = (query) => {
  const filter = {};

  if (query.search) {
    filter.title = {
      $regex: query.search,
      $options: "i",
    };
  }

  if (query.category && query.category !== "All") {
    filter.category = query.category;
  }

  if (query.from || query.to) {
    filter.createdAt = {};

    if (query.from) {
      const fromDate = new Date(query.from);
      fromDate.setHours(0, 0, 0, 0);
      filter.createdAt.$gte = fromDate.toISOString();
    }

    if (query.to) {
      const toDate = new Date(query.to);
      toDate.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = toDate.toISOString();
    }
  }

  return filter;
};

async function run() {
  await client.connect();

  const db = client.db(dbName);

  ideasCollection = db.collection("ideas");
  commentsCollection = db.collection("comments");
  usersCollection = db.collection("users");

  await ideasCollection.createIndex({
    title: "text",
    category: 1,
    authorEmail: 1,
    createdAt: -1,
  });

  await commentsCollection.createIndex({
    ideaId: 1,
    userEmail: 1,
    createdAt: -1,
  });

  await usersCollection.createIndex(
    { email: 1 },
    { unique: true }
  );

  app.post("/auth/register", async (req, res) => {
    try {
      const { name, email, photoURL, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).send({
          message: "Name, email, and password are required",
        });
      }

      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);

      if (
        password.length < 6 ||
        !hasUppercase ||
        !hasLowercase
      ) {
        return res.status(400).send({
          message:
            "Password must be at least 6 characters and include uppercase and lowercase letters",
        });
      }

      if (!jwtSecret) {
        return res.status(500).send({
          message: "JWT_SECRET is missing",
        });
      }

      const existingUser = await usersCollection.findOne({
        email,
      });

      if (existingUser && existingUser.passwordHash) {
        return res.status(409).send({
          message: "User already exists",
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      if (existingUser && !existingUser.passwordHash) {
        await usersCollection.updateOne(
          { email },
          {
            $set: {
              name,
              photoURL: photoURL || "",
              passwordHash,
              updatedAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            },
          }
        );
      } else {
        await usersCollection.insertOne({
          name,
          email,
          photoURL: photoURL || "",
          passwordHash,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        });
      }

      const token = jwt.sign(
        { email },
        jwtSecret,
        { expiresIn: "7d" }
      );

      res.status(201).send({
        token,
        user: {
          name,
          email,
          photoURL: photoURL || "",
        },
      });
    } catch (error) {
      res.status(500).send({
        message: "Registration failed",
        error: error.message,
      });
    }
  });

  app.post("/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).send({
          message: "Email and password are required",
        });
      }

      if (!jwtSecret) {
        return res.status(500).send({
          message: "JWT_SECRET is missing",
        });
      }

      const user = await usersCollection.findOne({
        email,
      });

      if (!user || !user.passwordHash) {
        return res.status(401).send({
          message: "Invalid email or password",
        });
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        return res.status(401).send({
          message: "Invalid email or password",
        });
      }

      await usersCollection.updateOne(
        { email },
        {
          $set: {
            lastLoginAt: new Date().toISOString(),
          },
        }
      );

      const token = jwt.sign(
        { email },
        jwtSecret,
        { expiresIn: "7d" }
      );

      res.send({
        token,
        user: {
          name: user.name || "IdeaVault User",
          email: user.email,
          photoURL: user.photoURL || "",
        },
      });
    } catch (error) {
      res.status(500).send({
        message: "Login failed",
        error: error.message,
      });
    }
  });

  app.get("/auth/me", verifyToken, async (req, res) => {
    try {
      const user = await usersCollection.findOne(
        { email: req.decoded.email },
        {
          projection: {
            passwordHash: 0,
          },
        }
      );

      if (!user) {
        return res.status(404).send({
          message: "User not found",
        });
      }

      res.send(user);
    } catch (error) {
      res.status(500).send({
        message: "Failed to fetch user",
        error: error.message,
      });
    }
  });

  app.patch("/auth/profile", verifyToken, async (req, res) => {
    try {
      const { name, photoURL } = req.body;

      if (!name) {
        return res.status(400).send({
          message: "Name is required",
        });
      }

      const result = await usersCollection.updateOne(
        { email: req.decoded.email },
        {
          $set: {
            name,
            photoURL: photoURL || "",
            updatedAt: new Date().toISOString(),
          },
        }
      );

      res.send(result);
    } catch (error) {
      res.status(500).send({
        message: "Profile update failed",
        error: error.message,
      });
    }
  });

  app.post("/jwt", async (req, res) => {
    try {
      const { email, name, photoURL } = req.body;

      if (!email) {
        return res.status(400).send({
          message: "Email is required",
        });
      }

      if (!jwtSecret) {
        return res.status(500).send({
          message: "JWT_SECRET is missing",
        });
      }

      await usersCollection.updateOne(
        { email },
        {
          $set: {
            email,
            name: name || "IdeaVault User",
            photoURL: photoURL || "",
            lastLoginAt: new Date().toISOString(),
          },
          $setOnInsert: {
            createdAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      );

      const token = jwt.sign(
        { email },
        jwtSecret,
        { expiresIn: "7d" }
      );

      res.send({ token });
    } catch (error) {
      res.status(500).send({
        message: "JWT generation failed",
        error: error.message,
      });
    }
  });

  app.get("/ideas", async (req, res) => {
    const filter = buildIdeaQuery(req.query);

    const limit = Math.min(
      Number(req.query.limit) || 0,
      50
    );

    const sort =
      req.query.sort === "oldest"
        ? { createdAt: 1 }
        : { createdAt: -1 };

    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: "comments",
          let: {
            ideaId: { $toString: "$_id" },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$ideaId", "$$ideaId"],
                },
              },
            },
          ],
          as: "comments",
        },
      },
      {
        $addFields: {
          commentsCount: {
            $size: "$comments",
          },
          trendingScore: {
            $add: [
              {
                $multiply: [
                  { $size: "$comments" },
                  3,
                ],
              },
              {
                $ifNull: ["$views", 0],
              },
            ],
          },
        },
      },
      {
        $project: {
          comments: 0,
        },
      },
      req.query.sort === "trending"
        ? {
            $sort: {
              trendingScore: -1,
              createdAt: -1,
            },
          }
        : {
            $sort: sort,
          },
    ];

    if (limit > 0) {
      pipeline.push({ $limit: limit });
    }

    const ideas = await ideasCollection
      .aggregate(pipeline)
      .toArray();

    res.send(ideas);
  });

  app.get("/ideas/:id", verifyToken, async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send({
        message: "Invalid idea id",
      });
    }

    await ideasCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $inc: {
          views: 1,
        },
      }
    );

    const idea = await ideasCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!idea) {
      return res.status(404).send({
        message: "Idea not found",
      });
    }

    res.send(idea);
  });

  app.post(
    "/ideas",
    verifyToken,
    verifyEmailOwner,
    async (req, res) => {
      const idea = req.body;

      const requiredFields = [
        "title",
        "shortDescription",
        "detailedDescription",
        "category",
        "imageURL",
        "targetAudience",
        "problemStatement",
        "proposedSolution",
        "authorEmail",
      ];

      const missingField = requiredFields.find(
        (field) => !idea[field]
      );

      if (missingField) {
        return res.status(400).send({
          message: `${missingField} is required`,
        });
      }

      const newIdea = {
        ...idea,
        tags: Array.isArray(idea.tags)
          ? idea.tags
          : [],
        estimatedBudget:
          idea.estimatedBudget || "Not specified",
        views: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await ideasCollection.insertOne(
        newIdea
      );

      res.status(201).send(result);
    }
  );

  app.patch("/ideas/:id", verifyToken, async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send({
        message: "Invalid idea id",
      });
    }

    const existing = await ideasCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!existing) {
      return res.status(404).send({
        message: "Idea not found",
      });
    }

    if (existing.authorEmail !== req.decoded.email) {
      return res.status(403).send({
        message:
          "Only the author can update this idea",
      });
    }

    const allowedFields = [
      "title",
      "shortDescription",
      "detailedDescription",
      "category",
      "tags",
      "imageURL",
      "estimatedBudget",
      "targetAudience",
      "problemStatement",
      "proposedSolution",
    ];

    const updateDoc = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateDoc[field] = req.body[field];
      }
    });

    updateDoc.updatedAt = new Date().toISOString();

    const result = await ideasCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: updateDoc,
      }
    );

    res.send(result);
  });

  app.delete("/ideas/:id", verifyToken, async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).send({
        message: "Invalid idea id",
      });
    }

    const existing = await ideasCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!existing) {
      return res.status(404).send({
        message: "Idea not found",
      });
    }

    if (existing.authorEmail !== req.decoded.email) {
      return res.status(403).send({
        message:
          "Only the author can delete this idea",
      });
    }

    const result = await ideasCollection.deleteOne({
      _id: new ObjectId(id),
    });

    await commentsCollection.deleteMany({
      ideaId: id,
    });

    res.send(result);
  });

  app.get(
    "/my-ideas",
    verifyToken,
    verifyEmailOwner,
    async (req, res) => {
      const ideas = await ideasCollection
        .find({
          authorEmail: req.query.email,
        })
        .sort({
          createdAt: -1,
        })
        .toArray();

      res.send(ideas);
    }
  );

  app.get(
    "/comments/idea/:ideaId",
    verifyToken,
    async (req, res) => {
      const comments = await commentsCollection
        .find({
          ideaId: req.params.ideaId,
        })
        .sort({
          createdAt: -1,
        })
        .toArray();

      res.send(comments);
    }
  );

  app.post(
    "/comments",
    verifyToken,
    verifyEmailOwner,
    async (req, res) => {
      const {
        ideaId,
        ideaTitle,
        userName,
        userEmail,
        userPhoto,
        commentText,
      } = req.body;

      if (
        !ideaId ||
        !commentText ||
        !userEmail
      ) {
        return res.status(400).send({
          message:
            "Idea id, comment text, and user email are required",
        });
      }

      const comment = {
        ideaId,
        ideaTitle:
          ideaTitle || "Startup Idea",
        userName:
          userName || "IdeaVault User",
        userEmail,
        userPhoto: userPhoto || "",
        commentText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result =
        await commentsCollection.insertOne(
          comment
        );

      res.status(201).send(result);
    }
  );

  app.patch(
    "/comments/:id",
    verifyToken,
    async (req, res) => {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).send({
          message: "Invalid comment id",
        });
      }

      const existing =
        await commentsCollection.findOne({
          _id: new ObjectId(id),
        });

      if (!existing) {
        return res.status(404).send({
          message: "Comment not found",
        });
      }

      if (existing.userEmail !== req.decoded.email) {
        return res.status(403).send({
          message:
            "Only the comment owner can update this comment",
        });
      }

      const result =
        await commentsCollection.updateOne(
          { _id: new ObjectId(id) },
          {
            $set: {
              commentText:
                req.body.commentText,
              updatedAt:
                new Date().toISOString(),
            },
          }
        );

      res.send(result);
    }
  );

  app.delete(
    "/comments/:id",
    verifyToken,
    async (req, res) => {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).send({
          message: "Invalid comment id",
        });
      }

      const existing =
        await commentsCollection.findOne({
          _id: new ObjectId(id),
        });

      if (!existing) {
        return res.status(404).send({
          message: "Comment not found",
        });
      }

      if (existing.userEmail !== req.decoded.email) {
        return res.status(403).send({
          message:
            "Only the comment owner can delete this comment",
        });
      }

      const result =
        await commentsCollection.deleteOne({
          _id: new ObjectId(id),
        });

      res.send(result);
    }
  );

  app.get(
    "/my-interactions",
    verifyToken,
    verifyEmailOwner,
    async (req, res) => {
      const comments =
        await commentsCollection
          .find({
            userEmail: req.query.email,
          })
          .sort({
            createdAt: -1,
          })
          .toArray();

      res.send(comments);
    }
  );

  app.use((req, res) => {
    res.status(404).send({
      message: "API route not found",
    });
  });

  if (!process.env.VERCEL) {
    app.listen(port, () => {
      console.log(
        `IdeaVault server running on port ${port}`
      );
    });
  }
}

export const ready = run().catch((error) => {
  console.error("Server startup error:", error);
  throw error;
});

export default app;