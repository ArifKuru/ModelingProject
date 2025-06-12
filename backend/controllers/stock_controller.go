package controllers

import (
	"SystemDynamicsBackend/database"
	"SystemDynamicsBackend/models"
	"fmt"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

type CreateStockRequest struct {
	ProjectId uint `json:"project_id" validate:"required"`
}

func CreateStock(ctx *fiber.Ctx) error {
	success := true
	message := "New Stock Successfully Created"
	stock := new(CreateStockRequest)
	err := ctx.BodyParser(stock)
	if err != nil {
		success = false
		message = "Invalid Request Format"
		return ctx.JSON(fiber.Map{
			"success": success,
			"message": message,
		})
	}

	newStock := models.Stock{
		ProjectID: stock.ProjectId,
	}

	err = database.VL.Struct(stock)
	if err != nil {
		success = false
		valErr := err.(validator.ValidationErrors)[0]
		message = fmt.Sprintf("'%s', Failed on '%s', with value '%s'", valErr.Field(), valErr.Tag(), valErr.Value())
		return ctx.JSON(fiber.Map{
			"success": success,
			"message": message,
		})
	}

	res := models.CreateStock(&newStock)
	if res.Error != nil {
		success = false
		message = res.Error.Error()
		return ctx.JSON(fiber.Map{
			"success": success,
			"message": message,
		})
	}

	return ctx.JSON(fiber.Map{
		"success": success,
		"message": message,
		"data":    newStock,
	})
}

type UpdateStockRequest struct {
	Name         string `json:"name" validate:"required"`
	InitialValue string `json:"initial_value" validate:"required"`
}

func UpdateStock(ctx *fiber.Ctx) error {
	success := true
	message := "Stock Successfully Updated"

	req := new(UpdateStockRequest)

	id := ctx.Params("id")
	err := ctx.BodyParser(req)

	if err != nil {
		success = false
		message = "Invalid Format"
		return ctx.JSON(fiber.Map{
			"success": success,
			"message": message,
		})
	}

	res := models.UpdateStock(req, id)

	if res.Error != nil || res.RowsAffected == 0 {
		success = false
		message = "Failed to update Stock"
	}

	return ctx.JSON(fiber.Map{
		"success": success,
		"message": message,
	})
}

func GetStocks(ctx *fiber.Ctx) error {
	success := true
	message := "Data Successfully Fetched"
	var stocks []models.Stock

	projectID := ctx.Query("project_id") // string olarak alır
	if projectID != "" {
		res := models.GetStocksByProjectId(&stocks, projectID)
		if res.Error != nil {
			success = false
			message = "Failed to Get data from database"
			return ctx.JSON(fiber.Map{
				"success": success,
				"message": res.Error.Error(),
			})
		}

	} else {
		res := models.GetStocks(&stocks)
		if res.Error != nil {
			success = false
			message = "Failed to Get data from database"
			return ctx.JSON(fiber.Map{
				"success": success,
				"message": message,
			})
		}
	}

	return ctx.JSON(fiber.Map{
		"success": success,
		"message": message,
		"data":    stocks,
	})
}

func DeleteStock(ctx *fiber.Ctx) error {
	success := true
	message := "Stock Successfully Deleted"
	id := ctx.Params("id")
	res := models.DeleteStock(id)
	if res.Error != nil || res.RowsAffected == 0 {
		success = false
		message = "Failed to Delete Stock"
	}
	return ctx.JSON(fiber.Map{"success": success, "message": message})
}
