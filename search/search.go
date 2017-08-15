package search

import (
	"bytes"
	"context"
	"crypto/md5"
	"github.com/Sirupsen/logrus"
	"github.com/dropbox/godropbox/errors"
	"github.com/pritunl/pritunl-zero/errortypes"
	"github.com/pritunl/pritunl-zero/requires"
	"github.com/pritunl/pritunl-zero/settings"
	"gopkg.in/mgo.v2/bson"
	"gopkg.in/olivere/elastic.v5"
	"io"
	"net/http"
	"net/url"
	"time"
)

var (
	ctx    = context.Background()
	client *elastic.Client
)

type Request struct {
	User      string      `json:"user"`
	Session   string      `json:"session"`
	Address   string      `json:"address"`
	Timestamp time.Time   `json:"timestamp"`
	Path      string      `json:"path"`
	Query     url.Values  `json:"query"`
	Header    http.Header `json:"header"`
	Body      string      `json:"body"`
}

type mapping struct {
	Field string
	Type  string
	Store bool
}

func Index(index, typ string, data interface{}) (err error) {
	clnt := client
	if clnt == nil {
		return
	}

	id := bson.NewObjectId().Hex()

	_, err = clnt.Index().Index(index).Type(typ).
		Id(id).BodyJson(data).Refresh("false").Do(ctx)
	if err != nil {
		err = errortypes.DatabaseError{
			errors.Wrap(err, "search: Failed to index elastic data"),
		}
		return
	}

	return
}

func putIndex(clnt *elastic.Client, index string, typ string,
	mappings []mapping) (err error) {

	exists, err := clnt.IndexExists(index).Do(ctx)
	if err != nil {
		err = errortypes.DatabaseError{
			errors.Wrap(err, "search: Failed to check elastic index"),
		}
		return
	}

	if exists {
		return
	}

	properties := map[string]interface{}{}

	for _, mapping := range mappings {
		if mapping.Type == "object" {
			properties[mapping.Field] = struct {
				Enabled bool `json:"enabled"`
			}{
				Enabled: false,
			}
		} else {
			properties[mapping.Field] = struct {
				Type  string `json:"type"`
				Store bool   `json:"store"`
			}{
				Type:  mapping.Type,
				Store: mapping.Store,
			}
		}
	}

	data := struct {
		Mappings map[string]interface{} `json:"mappings"`
	}{
		Mappings: map[string]interface{}{},
	}

	data.Mappings[typ] = struct {
		Properties map[string]interface{} `json:"properties"`
	}{
		Properties: properties,
	}

	_, err = clnt.CreateIndex(index).BodyJson(data).Do(ctx)
	if err != nil {
		err = errortypes.DatabaseError{
			errors.Wrap(err, "search: Failed to create elastic index"),
		}
		return
	}

	return
}

func newClient(addrs []string) (clnt *elastic.Client, err error) {
	if len(addrs) == 0 {
		return
	}

	clnt, err = elastic.NewClient(
		elastic.SetSniff(false),
		elastic.SetURL(addrs...),
	)
	if err != nil {
		err = errortypes.DatabaseError{
			errors.Wrap(err, "search: Failed to create elastic client"),
		}
		return
	}

	return
}

func hashAddresses(addrs []string) []byte {
	hash := md5.New()

	for _, addr := range addrs {
		io.WriteString(hash, addr)
	}

	return hash.Sum(nil)
}

func update(addrs []string) (err error) {
	clnt, err := newClient(addrs)
	if err != nil {
		client = nil
		return
	}

	if clnt == nil {
		client = nil
		return
	}

	mappings := []mapping{}

	mappings = append(mappings, mapping{
		Field: "user",
		Type:  "keyword",
		Store: false,
	})

	mappings = append(mappings, mapping{
		Field: "session",
		Type:  "keyword",
		Store: false,
	})

	mappings = append(mappings, mapping{
		Field: "address",
		Type:  "ip",
		Store: false,
	})

	mappings = append(mappings, mapping{
		Field: "timestamp",
		Type:  "date",
		Store: false,
	})

	mappings = append(mappings, mapping{
		Field: "path",
		Type:  "keyword",
		Store: false,
	})

	mappings = append(mappings, mapping{
		Field: "query",
		Type:  "object",
	})

	mappings = append(mappings, mapping{
		Field: "header",
		Type:  "object",
	})

	mappings = append(mappings, mapping{
		Field: "body",
		Type:  "text",
		Store: false,
	})

	err = putIndex(clnt, "zero-requests", "request", mappings)
	if err != nil {
		client = nil
		return
	}

	client = clnt

	return
}

func watchSearch() {
	hash := hashAddresses([]string{})

	for {
		addrs := settings.Elastic.Addresses
		newHash := hashAddresses(addrs)

		if bytes.Compare(hash, newHash) != 0 {
			err := update(addrs)
			if err != nil {
				logrus.WithFields(logrus.Fields{
					"error": err,
				}).Error("search: Failed to update search indexes")
				time.Sleep(3 * time.Second)
				continue
			}

			hash = newHash
		}

		time.Sleep(1 * time.Second)
	}
}

func init() {
	module := requires.New("search")
	module.After("settings")

	module.Handler = func() (err error) {
		go watchSearch()
		return
	}
}