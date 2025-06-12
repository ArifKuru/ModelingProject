package utils

import (
	"fmt"
	"go/ast"
	"go/parser"
	"go/token"
	"regexp"
	"strconv"
)

// EvaluateExpression replaces [name] tokens using provided maps and evaluates the arithmetic expression.
func EvaluateExpression(expr string, stocks map[string]int, vars map[string]int) (int, error) {
	r := regexp.MustCompile(`\[(.+?)\]`)
	expr = r.ReplaceAllStringFunc(expr, func(s string) string {
		key := s[1 : len(s)-1]
		if val, ok := stocks[key]; ok {
			return fmt.Sprintf("%d", val)
		}
		if val, ok := vars[key]; ok {
			return fmt.Sprintf("%d", val)
		}
		return "0"
	})

	node, err := parser.ParseExpr(expr)
	if err != nil {
		return 0, err
	}
	return evalNode(node)
}

func evalNode(node ast.Expr) (int, error) {
	switch n := node.(type) {
	case *ast.BasicLit:
		if n.Kind == token.INT {
			return strconv.Atoi(n.Value)
		}
	case *ast.BinaryExpr:
		l, err := evalNode(n.X)
		if err != nil {
			return 0, err
		}
		r, err := evalNode(n.Y)
		if err != nil {
			return 0, err
		}
		switch n.Op {
		case token.ADD:
			return l + r, nil
		case token.SUB:
			return l - r, nil
		case token.MUL:
			return l * r, nil
		case token.QUO:
			if r == 0 {
				return 0, fmt.Errorf("division by zero")
			}
			return l / r, nil
		}
	case *ast.ParenExpr:
		return evalNode(n.X)
	}
	return 0, fmt.Errorf("unsupported expression")
}
