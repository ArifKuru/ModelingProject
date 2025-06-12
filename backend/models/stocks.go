package models

import (
	"SystemDynamicsBackend/database"
	"gorm.io/gorm"
)

type Stock struct {
	ID           int    `json:"id"`
	Name         string `json:"name" gorm:"default:'New Stock'"`
	InitialValue string `json:"initial_value" gorm:"default:0"`
	ProjectID    uint   `json:"project_id"`
}

func CreateStock(stock *Stock) *gorm.DB {
	return database.DB.Create(stock)
}

func GetStocks(stocks *[]Stock) *gorm.DB {
	return database.DB.Find(&stocks)
}

func GetStocksByProjectId(stocks *[]Stock, project_id any) *gorm.DB {
	return database.DB.Where("project_id = ?", project_id).Find(&stocks)
}

func UpdateStock(data any, id any) *gorm.DB {
	return database.DB.Model(&Stock{}).Where("id=?", id).Updates(data)
}

func DeleteStock(id any) *gorm.DB {
	return database.DB.Delete(&Stock{}, id)
}
