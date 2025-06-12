package routes

import (
	"SystemDynamicsBackend/controllers"
	"github.com/gofiber/fiber/v2"
)

func SetupRoutes(app *fiber.App) {
	app.Post("/projects", controllers.CreateProject)
	app.Get("/projects", controllers.GetProjects)
	app.Get("/projects/:id", controllers.GetProject)
	app.Post("/stocks", controllers.CreateStock)
	app.Put("/stocks/:id", controllers.UpdateStock)
	app.Delete("/stocks/:id", controllers.DeleteStock)
	app.Get("/stocks", controllers.GetStocks)

	app.Post("/variables", controllers.CreateVariable)
	app.Put("/variables/:id", controllers.UpdateVariable)
	app.Get("/variables", controllers.GetVariables)
	app.Get("/variables/:id", controllers.GetVariable)
	app.Delete("/variables/:id", controllers.DeleteVariable)

	app.Post("/flows", controllers.CreateFlow)
	app.Put("/flows/:id", controllers.UpdateFlow)
	app.Get("/flows", controllers.GetFlows)
	app.Get("/flows/:id", controllers.GetFlow)
	app.Delete("/flows/:id", controllers.DeleteFlow)

	app.Post("/simulate", controllers.Simulate)

}
