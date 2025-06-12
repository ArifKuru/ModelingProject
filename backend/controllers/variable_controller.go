package controllers

import (
	"SystemDynamicsBackend/database"
	"SystemDynamicsBackend/models"
	"fmt"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type CreateVariableRequest struct {
	Name      string `json:"name" validate:"required"`
	Value     string `json:"value" validate:"required"`
	ProjectID uint   `json:"project_id" validate:"required"`
}

type UpdateVariableRequest struct {
	Name  string `json:"name" validate:"required"`
	Value string `json:"value" validate:"required"`
}

func CreateVariable(ctx *fiber.Ctx) error {
	success := true
	message := "Variable Successfully Created"
	req := new(CreateVariableRequest)
	if err := ctx.BodyParser(req); err != nil {
		success = false
		message = "Invalid Request Format"
		return ctx.JSON(fiber.Map{"success": success, "message": message})
	}

	if err := database.VL.Struct(req); err != nil {
		success = false
		valErr := err.(validator.ValidationErrors)[0]
		message = fmt.Sprintf("%s failed on %s with value %s", valErr.Field(), valErr.Tag(), valErr.Value())
		return ctx.JSON(fiber.Map{"success": success, "message": message})
	}

	variable := models.Variable{
		Name:      req.Name,
		Value:     req.Value,
		ProjectID: req.ProjectID,
	}
	if res := models.CreateVariable(&variable); res.Error != nil {
		success = false
		message = res.Error.Error()
	}

	return ctx.JSON(fiber.Map{"success": success, "message": message, "data": variable})
}

func UpdateVariable(ctx *fiber.Ctx) error {
	success := true
	message := "Variable Successfully Updated"
	id := ctx.Params("id")
	req := new(UpdateVariableRequest)
	if err := ctx.BodyParser(req); err != nil {
		success = false
		message = "Invalid Format"
		return ctx.JSON(fiber.Map{"success": success, "message": message})
	}

	if err := database.VL.Struct(req); err != nil {
		success = false
		valErr := err.(validator.ValidationErrors)[0]
		message = fmt.Sprintf("%s failed on %s with value %s", valErr.Field(), valErr.Tag(), valErr.Value())
		return ctx.JSON(fiber.Map{"success": success, "message": message})
	}

	res := models.UpdateVariable(req, id)
	if res.Error != nil || res.RowsAffected == 0 {
		success = false
		message = "Failed to update Variable"
	}

	return ctx.JSON(fiber.Map{"success": success, "message": message})
}

func GetVariables(ctx *fiber.Ctx) error {
	success := true
	message := "Data Successfully Fetched"
	var vars []models.Variable
	projectID := ctx.Query("project_id")
	if projectID != "" {
		res := models.GetVariablesByProjectId(&vars, projectID)
		if res.Error != nil {
			success = false
			message = res.Error.Error()
			return ctx.JSON(fiber.Map{"success": success, "message": message})
		}
	} else {
		res := models.GetVariables(&vars)
		if res.Error != nil {
			success = false
			message = "Failed to Get data from database"
			return ctx.JSON(fiber.Map{"success": success, "message": message})
		}
	}

	return ctx.JSON(fiber.Map{"success": success, "message": message, "data": vars})
}

func GetVariable(ctx *fiber.Ctx) error {
	success := true
	message := "Successfully Fetched"
	id := ctx.Params("id")
	var variable models.Variable
	res := models.GetVariableByID(&variable, id)
	if res.Error != nil {
		success = false
		message = "Failed to Get data from database"
		return ctx.JSON(fiber.Map{"success": success, "message": message})
	}
	return ctx.JSON(fiber.Map{"success": success, "message": message, "data": variable})
}

func DeleteVariable(ctx *fiber.Ctx) error {
	success := true
	message := "Variable Successfully Deleted"
	id := ctx.Params("id")
	res := models.DeleteVariable(id)
	if res.Error != nil || res.RowsAffected == 0 {
		success = false
		message = "Failed to Delete Variable"
	}
	return ctx.JSON(fiber.Map{"success": success, "message": message})
}
