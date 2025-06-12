package main

import (
	"SystemDynamicsBackend/database"
	"SystemDynamicsBackend/models"
	"SystemDynamicsBackend/routes"
	"fmt"
	"github.com/gofiber/fiber/v2"
)

func main() {

	database.Connect()

	err := database.DB.AutoMigrate(
		&models.Stock{},
		&models.Project{},
		&models.Variable{},
		&models.Flow{},
	)

	if err != nil {
		fmt.Println("Migration error")
	}

	app := fiber.New()

	routes.SetupRoutes(app)

	app.Listen("localhost:2000")

}
