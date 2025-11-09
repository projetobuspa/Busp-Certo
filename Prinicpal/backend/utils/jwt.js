//importing json web token to create a token function to be used during login attempt
const jwt = require("jsonwebtoken");

//main token function that will be sending the token with some information init
const token = (foundUser, response) => {
  try {
    //creating a jwt with the user's id, username, email and environmental variables
    const jwtToken = jwt.sign(
      {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d"
      }
    );

    // Enviar o token no corpo da resposta
    return response.status(200).json({
      success: true,
      token: jwtToken,
      user: {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email
      }
    });
  } catch (error) {
    console.error("Error generating token:", error);
    return response.status(500).json({ 
      success: false, 
      message: "Error generating authentication token" 
    });
  }
};

//exporting the created token
module.exports = token;
