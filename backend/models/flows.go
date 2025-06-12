package models

import (
	"SystemDynamicsBackend/database"
	"gorm.io/gorm"
)

// Flow represents movement between stocks. FromStock and ToStock can be nil.
type Flow struct {
	ID        int    `json:"id"`
	Name      string `json:"name" gorm:"default:'New Flow'"`
	FromStock *uint  `json:"from_stock"`
	ToStock   *uint  `json:"to_stock"`
}

func CreateFlow(flow *Flow) *gorm.DB {
	return database.DB.Create(flow)
}

func GetFlows(flows *[]Flow) *gorm.DB {
	return database.DB.Find(flows)
}

func GetFlow(flow *Flow, id any) *gorm.DB {
	return database.DB.Where("id = ?", id).First(flow)
}

func UpdateFlow(data any, id any) *gorm.DB {
	return database.DB.Model(&Flow{}).Where("id = ?", id).Updates(data)
}

func DeleteFlow(id any) *gorm.DB {
	return database.DB.Delete(&Flow{}, id)
}

// GetFlowsByStocks fetches flows that are connected to any of the given stock IDs.
func GetFlowsByStocks(flows *[]Flow, ids []uint) *gorm.DB {
	return database.DB.Where("from_stock IN ? OR to_stock IN ?", ids, ids).Find(flows)
}
