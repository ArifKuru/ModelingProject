package controllers

import (
	"SystemDynamicsBackend/database"
	"SystemDynamicsBackend/models"
	"fmt"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type CreateProjectRequest struct {
	Name string `json:"name" validate:"required"`
}

func CreateProject(ctx *fiber.Ctx) error {
	success := true
	message := "Project successfully Created"
	project := new(CreateProjectRequest)
	err := ctx.BodyParser(project)
	if err != nil {
		success = false
		message = "Invalid Request Format"
		return ctx.JSON(fiber.Map{
			"success": success,
			"message": message,
		})
	}

	err = database.VL.Struct(project)
	if err != nil {
		success = false
		valErr := err.(validator.ValidationErrors)[0]
		message = fmt.Sprintf("Field '%s', failed on '%s' with your value '%s'", valErr.Field(), valErr.Tag(), valErr.Value())
		return ctx.JSON(fiber.Map{
			"success": success,
			"message": message,
		})
	}

	newProject := models.Project{
		Name: project.Name,
	}

	res := models.CreateProject(&newProject)
	if res.Error != nil {
		success = false
		message = res.Error.Error()
	}

	return ctx.JSON(fiber.Map{
		"success": success,
		"message": message,
		"data":    newProject,
	})
}

func GetProjects(ctx *fiber.Ctx) error {
	success := true
	message := "Data Successfully Fetched"
	var projects []models.Project
	res := models.GetProjects(&projects)
	if res.Error != nil {
		success = false
		message = "Failed to Get data from database"
	}
	return ctx.JSON(fiber.Map{
		"success": success,
		"message": message,
		"data":    projects,
	})
}

func GetProject(ctx *fiber.Ctx) error {
	success := true
	message := "Successfully Fetched"

	id := ctx.Params("id")

	var project models.Project
	res := models.GetProject(&project, id)
	if res.Error != nil {
		success = false
		message = "Failed to Get data from database"
		return ctx.JSON(fiber.Map{
			"success": success,
			"message": message,
		})
	}

	return ctx.JSON(fiber.Map{
		"success": success,
		"message": message,
		"data":    project,
	})
}
