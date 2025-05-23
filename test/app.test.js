import 'dotenv/config';

import defineApi from "../app.js";
import express from "express";
import session from 'express-session';
import request from "supertest";

import Database from 'better-sqlite3';

const sessionName     = "test_sessionid";
const sessionSecret   = "totally-a-secret";

const races = new Database(":memory:");

races.exec(`CREATE TABLE IF NOT EXISTS 'races' (
    'id' INTEGER PRIMARY KEY AUTOINCREMENT,
    'name' TEXT,
    'mode' TEXT,
    'time' INTEGER,
    'created_at' TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

races.exec(`CREATE TABLE IF NOT EXISTS 'counters' (
    'mode' TEXT,
    'count' INTEGER
)`);

races.exec(`INSERT INTO counters (mode, count) VALUES ('normal-main', 0);`);
races.exec(`INSERT INTO counters (mode, count) VALUES ('encore-main', 0);`);
races.exec(`INSERT INTO counters (mode, count) VALUES ('normal-survival', 0);`);
races.exec(`INSERT INTO counters (mode, count) VALUES ('encore-survival', 0);`);

const app = express();

app.use(express.json());

app.use(session({
    name: sessionName,
    saveUninitialized: false,
    secret: sessionSecret,
    resave: false,
}));

defineApi(app, races);

let sessionCookie = null;
let raceId        = null;

function isSortedAscending(arr) {
    const sortedArray = [...arr].sort((a, b) => a - b);
    return arr.every((value, index) => value === sortedArray[index]);
}

function isSortedDescending(arr) {
    const sortedArray = [...arr].sort((a, b) => b - a);
    return arr.every((value, index) => value === sortedArray[index]);
}

describe("ENDPOINT /api/session", () =>
{
    describe("GET /api/session - cookie not set", () =>
    {
        it("should respond with code 404", (done) =>
        {
            const test = request(app).get("/api/session");
            
            test.expect(404)
                .end((err, res) =>
                {
                    done(err);
                });
        });

        it("should respond with json", (done) =>
        {
            const test = request(app).get("/api/session");
            
            test.expect("Content-Type", /json/)
                .end((err, res) =>
                {
                    done(err);
                });
        });
    
        it("should respond with `session not found` in body", (done) =>
        {
            const test = request(app).get("/api/session");
            
            test.expect(/session not found/)
                .end((err, res) =>
                {
                    done(err);
                });
        });
    }); // GET /api/session
    
    describe("POST /api/session", () =>
    {
        it("should respond with code 200", (done) =>
        {
            const test = request(app).post("/api/session");

            test.expect(200)
                .end((err, res) =>
                {
                    done(err);
                });
        });
        
        it("should respond with json", (done) =>
        {
            const test = request(app).post("/api/session");

            test.expect('Content-Type', /json/)
                .end((err, res) =>
                {
                    done(err);
                });
        });
        
        it("should set cookie", (done) =>
        {
            const test = request(app).post("/api/session");

            test.expect("set-cookie", /sessionid/)
                .end((err, res) =>
                {
                    sessionCookie = res.headers['set-cookie'].pop().split(';')[0];
                    done(err);
                });
        });
    }); // POST /api/session
    
    describe("GET /api/session - with cookie set", () =>
    {
        it("should respond with code 200", (done) =>
        {
            const test = request(app).get("/api/session");
            
            test.cookies = sessionCookie;
            
            test.expect(200)
                .end((err, res) =>
                {
                    done(err);
                });
        });

        it("should respond with json", (done) =>
        {
            const test = request(app).get("/api/session");
            
            test.cookies = sessionCookie;

            test.expect("Content-Type", /json/)
                .end((err, res) =>
                {
                    done(err);
                });
        });
    
        it("should respond with `session exists` in body", (done) =>
        {
            const test = request(app).get("/api/session");
            
            test.cookies = sessionCookie;

            test.expect(/session exists/)
                .end((err, res) =>
                {
                    done(err);
                });
        }); 
    }); // GET /session - with cookie set

}); // ENDPOINT /session

describe("ENDPOINT /api/counters/(normal|encore) - cookie not set", () =>
{

    describe(`GET /api/counters`, () =>
    {
        it("should respond with json", (done) =>
        {
            const test = request(app).get(`/api/counters`);
            
            test.expect("Content-Type", /json/)
                .end((err, res) =>
                {
                    done(err);
                });
        });
        
        it("should respond with code 401", (done) =>
        {
            const test = request(app).get(`/api/counters`);
            
            test.expect(401)
                .end((err, res) =>
                {
                    done(err);
                });
        });
    
        it("should respond with `unauthorized` in body", (done) =>
        {
            const test = request(app).get(`/api/counters`);
            
            test.expect(/unauthorized/)
                .end((err, res) =>
                {
                    done(err);
                });
        });
    });
    
    ['normal-main', 'encore-main', 'normal-survival','encore-survival',].forEach((mode) =>
    {
        describe(`GET /api/counters/${mode}`, () =>
        {
            it("should respond with json", (done) =>
            {
                const test = request(app).get(`/api/counters/${mode}`);
                
                test.expect("Content-Type", /json/)
                    .end((err, res) =>
                    {
                        done(err);
                    });
            });
            
            it("should respond with code 401", (done) =>
            {
                const test = request(app).get(`/api/counters/${mode}`);
                
                test.expect(401)
                    .end((err, res) =>
                    {
                        done(err);
                    });
            });
        
            it("should respond with `unauthorized` in body", (done) =>
            {
                const test = request(app).get(`/api/counters/${mode}`);
                
                test.expect(/unauthorized/)
                    .end((err, res) =>
                    {
                        done(err);
                    });
            });
        });
    
        describe(`POST /api/counters/${mode}`, () =>
        {
            it("should respond with json", (done) =>
            {
                const test = request(app).post(`/api/counters/${mode}`);
                
                test.expect("Content-Type", /json/)
                    .end((err, res) =>
                    {
                        done(err);
                    });
            });
            
            it("should respond with code 401", (done) =>
            {
                const test = request(app).post(`/api/counters/${mode}`);
                
                test.expect(401)
                    .end((err, res) =>
                    {
                        done(err);
                    });
            });
        
            it("should respond with `unauthorized` in body", (done) =>
            {
                const test = request(app).post(`/api/counters/${mode}`);
                
                test.expect(/unauthorized/)
                    .end((err, res) =>
                    {
                        done(err);
                    });
            });
        });
    }); // normal,encore
});

describe("ENDPOINT /api/counters/(normal|encore) - cookie set", () =>
{
    describe(`GET /api/counters`, () =>
    {
        it("should respond with json", (done) =>
        {
            const test = request(app).get(`/api/counters`);
            
            test.cookies = sessionCookie;
            test.expect(200)
                .end((err, res) =>
                {
                    done(err);
                });
        });
    
        it("should respond with 4 results in body", (done) =>
        {
            const test = request(app).get(`/api/counters`);
            
            test.cookies = sessionCookie;
            test.expect(200)
                .end((err, res) =>
                {
                    if(err)
                    {
                        done(err);
                        return;
                    }

                    if(res.body.results.length != 4)
                    {
                        done(new Error(`epxected 4 reults but got ${res.body.results.length}`))
                        return;
                    }
                    
                    done();
                });

        });
    });

    ['normal-main', 'encore-main', 'normal-survival','encore-survival'].forEach((mode) =>
    {
        describe(`GET /api/counters/${mode}`, () =>
        {
            it("should respond with json", (done) =>
            {
                const test = request(app).get(`/api/counters/${mode}`);
                
                test.cookies = sessionCookie;
                test.expect(200)
                    .end((err, res) =>
                    {
                        done(err);
                    });
            });
        
            it("should respond with `count` in body", (done) =>
            {
                const test = request(app).get(`/api/counters/${mode}`);
                
                test.cookies = sessionCookie;
                test.expect(/count/)
                    .end((err, res) =>
                    {
                        done(err);
                    });

            });
        });

        describe(`POST /api/counters/${mode}`, () =>
        {
            it("should respond with json", (done) =>
            {
                const test = request(app).post(`/api/counters/${mode}`);
                
                test.cookies = sessionCookie;
                test.expect(200)
                    .end((err, res) =>
                    {
                        done(err);
                    });
            });
        
            it("should respond with `count` in body", (done) =>
            {
                const test = request(app).post(`/api/counters/${mode}`);
                
                test.cookies = sessionCookie;
                test.expect(/count/)
                    .end((err, res) =>
                    {
                        done(err);
                    });
            });

            it("should respond with a count of 3", (done) =>
            {
                const test = request(app)
                    .post(`/api/counters/${mode}`)
                    .set('Cookie', sessionCookie)
                    .expect(200)
                    .expect((res) =>
                    {
                        if(res.body.count !== 3)
                            throw new Error(`Expected count to be 3, but got ${res.body.count}`);
                    })
                    .end((err, res) =>
                    {
                        done(err);
                    });
            });
        });
    }); // normal,encore
});

describe("ENDPOINT /api/race - cookie not set", () =>
{
    describe("POST /api/race", () =>
    {
        it("should respond with json", (done) =>
        {
            const test = request(app).post("/api/race");
            
            test.expect("Content-Type", /json/)
                .end((err, res) =>
                {
                    done(err);
                });
        });
    
        it("should respond with code 401", (done) =>
        {
            const test = request(app).post("/api/race");
            
            test.expect(401)
                .end((err, res) =>
                {
                    done(err);
                });
        });

        it("should respond with `unauthorized` in body", (done) =>
        {
            const test = request(app).post("/api/race");
            
            test.expect(/unauthorized/)
                .end((err, res) =>
                {
                    done(err);
                });
        });
    }); // POST /race
    

    describe("PATCH /api/race", () =>
    {
        it("should respond with json", (done) =>
        {
            const test = request(app).patch("/api/race");
            
            test.expect("Content-Type", /json/)
                .end((err, res) =>
                {
                    done(err);
                });
        });
    
        it("should respond with code 401", (done) =>
        {
            const test = request(app).patch("/api/race");
            
            test.expect(401)
                .end((err, res) =>
                {
                    done(err);
                });
        });

        it("should respond with `unauthorized` in body", (done) =>
        {
            const test = request(app).patch("/api/race");
            
            test.expect(/unauthorized/)
                .end((err, res) =>
                {
                    done(err);
                });
        });
    }); // PATCH /race
    
    describe("DELETE /race", () =>
    {
        it("should respond with json", (done) =>
        {
            const test = request(app).delete("/api/race");
            
            test.expect("Content-Type", /json/)
                .end((err, res) =>
                {
                    done(err);
                });
        });

        it("should respond with code 401", (done) =>
        {
            const test = request(app).delete("/api/race");
            
            test.expect(401)
                .end((err, res) =>
                {
                    done(err);
                });
        });
    
        it("should respond with `unauthorized` in body", (done) =>
        {
            const test = request(app).delete("/api/race");
            
            test.expect(/unauthorized/)
                .end((err, res) =>
                {
                    done(err);
                });
        });
    }); // DELETE /race

}); // ENDPOINT /race - cookie not set

describe("ENDPOINT /api/race - with cookie set", () =>
{
    describe("POST /api/race", () =>
    {
        it("should respond with json", (done) =>
        {
            const test = request(app).post("/api/race");
            
            test.cookies = sessionCookie;

            test.expect("Content-Type", /json/)
                .end((err, res) =>
                {
                    done(err);
                });
        });
    
        it("should respond with code 200", (done) =>
        {
            const test = request(app).post("/api/race");
            
            test.cookies = sessionCookie;
            
            test.expect(200)
                .end((err, res) =>
                {
                    done(err);
                });
        });

        it("should respond with `race started` in body", (done) =>
        {
            const test = request(app).post("/api/race");
            
            test.cookies = sessionCookie;

            test.expect(/race started/)
                .end((err, res) =>
                {
                    raceId = res.body.raceId;
                    done(err);
                });
        });
    }); // POST /race

    describe("PATCH /api/race - missing parameters", () =>
    {
        it("should respond with json", (done) =>
        {
            const test = request(app).patch("/api/race");
            
            test.cookies = sessionCookie;

            test.expect("Content-Type", /json/)
                .end((err, res) =>
                {
                    done(err);
                });
        });
    
        it("should respond with code 400", (done) =>
        {
            const test = request(app).patch("/api/race");
            
            test.cookies = sessionCookie;

            test.expect(400)
                .end((err, res) =>
                {
                    done(err);
                });
        });
        
        it("should respond with `required parameter (.*) missing`", (done) =>
        {
            const test = request(app).patch("/api/race");
            
            test.cookies = sessionCookie;
            
            test.expect(/required parameter (.*) missing/)
                .end((err, res) =>
                {
                    done(err);
                });
        });

    }); // PATCH /race - missing parameters


    describe("PATCH /api/race - with parameters", () =>
    {
        it("should respond with json", (done) =>
        {
            const test = request(app).patch("/api/race");
            
            test.cookies = sessionCookie;

            test.expect("Content-Type", /json/)
                .end((err, res) =>
                {
                    done(err);
                });
        });
    

        it("should respond with code 200 - finish race", (done) =>
        {
            const getRaceTime = request(app).post("/api/race");
            getRaceTime.cookies = sessionCookie;
            getRaceTime.end((err, req) =>
            {
                raceId = req.body.raceId;

                const test = request(app).patch("/api/race");
            
                test.cookies = sessionCookie;
                
                test.send({ raceId: raceId, raceTime: 50, raceMode: "the-mode" })
                    .expect(200)
                    .end((err, res) =>
                    {
                        done(err);
                    });
            });
        });
        
        it("should accept times 1000ms difference - finish race", (done) =>
        {
            const getRaceTime = request(app).post("/api/race");
            getRaceTime.cookies = sessionCookie;
            getRaceTime.end((err, req) =>
            {
                raceId = req.body.raceId;

                const test = request(app).patch("/api/race");
            
                test.cookies = sessionCookie;
                
                test.send({ raceId: raceId, raceTime: 1000, raceMode: "the-mode" })
                    .expect(200)
                    .end((err, res) =>
                    {
                        done(err);
                    });
            });
            
        });
    
        it("should reject times 2000ms difference", (done) =>
        {
            const getRaceTime = request(app).post("/api/race");
            
            getRaceTime.cookies = sessionCookie;
            
            getRaceTime.end((err, req) =>
            {
                raceId = req.body.raceId;
                
                const test = request(app).patch("/api/race");
            
                test.cookies = sessionCookie;
                
                test.send({ raceId: raceId, raceTime: 2000, raceMode: "the-mode" })
                    .expect(400)
                    .expect(/raceTime mismatch/)
                    .end((err, res) =>
                    {
                        done(err);
                    });
            });
        });
    
    }); // PATCH /race - with parameters

    describe("DELETE /api/race - missing parameters", () =>
    {
        it("should respond with json", (done) =>
        {
            const test = request(app).delete("/api/race");
            
            test.cookies = sessionCookie;

            test.expect("Content-Type", /json/)
                .end((err, res) =>
                {
                    done(err);
                });
        });

        it("should respond with `required parameter (.*) missing`", (done) =>
        {
            const test = request(app).delete("/api/race");
            
            test.cookies = sessionCookie;
            
            test.expect(/required parameter (.*) missing/)
                .end((err, res) =>
                {
                    done(err);
                });
        });

    }); // DELETE /race - missing parameters

    describe("DELETE /api/race - with parameters", () =>
    {
        it("should respond with json", (done) =>
        {
            const test = request(app).delete("/api/race");
            
            test.cookies = sessionCookie;

            test.expect("Content-Type", /json/)
                .end((err, res) =>
                {
                    done(err);
                });
        });

        it("should respond with code 404 when raceId mismatch", (done) =>
        {
            const test = request(app).delete("/api/race");
            
            test.cookies = sessionCookie;
            
            test.send({ raceId: "totally-does-not-exist" })
                .expect(404)
                .end((err, res) =>
                {
                    done(err);
                });
        });
        
        it("should respond with code 200", (done) =>
        {
            const getRaceTime = request(app).post("/api/race");
            getRaceTime.cookies = sessionCookie;
            getRaceTime.end((err, req) =>
            {
                raceId = req.body.raceId;

                const test = request(app).delete("/api/race");
            
                test.cookies = sessionCookie;
            
                test.send({ raceId: raceId })
                    .expect(200)
                    .end((err, res) =>
                    {
                        done(err);
                    });
            });
        });
    }); // DELETE /race - with parameters


}); // ENDPOINT /race - with cookie set

describe("ENDPOINT /api/name - cookie not set", () =>
{
    describe("POST /api/name", () =>
    {
        it("should respond with json", (done) =>
        {
            const test = request(app).post("/api/name");
            
            test.expect("Content-Type", /json/)
                .end((err, res) =>
                {
                    done(err);
                });
        });

        it("should respond with code 401", (done) =>
        {
            const test = request(app).post("/api/name");
            
            test.expect(401)
                .end((err, res) =>
                {
                    done(err);
                });
        });

        it("should respond with `unauthorized` in body", (done) =>
        {
            const test = request(app).post("/api/name");
            
            test.expect(/unauthorized/)
                .end((err, res) =>
                {
                    done(err);
                });
        });
    });
});

describe("ENDPOINT /api/name - with cookie set", () =>
{
    describe("POST /api/name", () =>
    {
    
        it("should respond with json", (done) =>
        {
            const test = request(app).post("/api/name");
            
            test.cookies = sessionCookie;

            test.expect("Content-Type", /json/)
                .end((err, res) =>
                {
                    done(err);
                });
        });

        it("should respond with `required parameter (.*) missing`", (done) =>
        {
            const test = request(app).post("/api/name");
            
            test.cookies = sessionCookie;
            
            test.expect(/required parameter (.*) missing/)
                .end((err, res) =>
                {
                    done(err);
                });
        });

        it("should set name to `Javidx9`", (done) =>
        {
            const test = request(app).post("/api/name");
            
            test.cookies = sessionCookie;
            
            test.send({ userName: "Javidx9" })
                .expect(200)
                .expect(/name is set/)
                .end((err, res) =>
                {
                    done(err);
                });
        });
        
        it("should reject bad words for name", (done) =>
        {
            const test = request(app).post("/api/name");
            
            test.cookies = sessionCookie;
            
            test.send({ userName: "DirtySlut69" })
                .expect(406)
                .end((err, res) =>
                {
                    done(err);
                });
        });
    });
}); // ENDPOINT /api/name - with cookie set

describe("GET /api/race", () =>
{
    before(function()
    {
        const racesToInsert = [];

        for(let i = 0; i < 50; i++)
        {
            racesToInsert.push({
                name: `Entry${i+1}`,
                mode: "normal",
                time: (i + 1)
            });
        }
        
        racesToInsert.sort(() => Math.random() - 0.5);

        let stmt = races.prepare("INSERT INTO `races` (`name`, `mode`, `time`) VALUES (@name, @mode, @time);");
        
        racesToInsert.forEach((race) =>
        {
            stmt.run(race);
        });
    });

    after(function()
    {
        races.exec("DELETE FROM races");
    });

    it("should respond with json", (done) =>
    {
        const test = request(app).post("/api/race");
        
        test.expect("Content-Type", /json/)
            .end((err, res) =>
            {
                done(err);
            });
    });

    it("should respond with 10 results on a default call", (done) =>
    {
        const test = request(app).get("/api/race?mode=normal");
        
        test.expect(200)
            .end((err, res) =>
            {
                if(err)
                {
                    done(err);
                    return;
                }

                if(res.body.results.length != 10)
                {
                    done(new Error(`expected 10 results but got ${res.body.results.length}`));
                    return;
                }
                
                done();
            })
    });

    it("should respond with 0 results when a mode does not exist", (done) =>
    {
        const test = request(app).get("/api/race?mode=mode-not-exist");
        
        test.expect(200)
            .end((err, res) =>
            {
                if(err)
                {
                    done(err);
                    return;
                }

                if(res.body.results.length != 0)
                {
                    done(new Error(`expected 0 results but got ${res.body.results.length}`));
                    return;
                }
                
                done();
            })
    });
    
    it("should respond with 10 results sorted by `time` in ascending order", (done) =>
    {
        const test = request(app).get("/api/race?mode=normal&sortBy=time&sort=ASC");
        
        test.expect(200)
            .end((err, res) =>
            {
                if(err)
                {
                    done(err);
                    return;
                }

                if(res.body.results.length != 10)
                {
                    done(new Error(`expected 10 results but got ${res.body.results.length}`));
                    return;
                }
                
                let out = [];
                res.body.results.forEach((result) => out.push(result.time));
                
                if(!isSortedAscending(out))
                {
                    done(new Error(`expected 10 results ordered by time, in ascending order but got ${out.toString()}`));
                    return;
                }

                done();
            })
    });
    
    it("should respond with 10 results sorted by `time` in descending order", (done) =>
    {
        const test = request(app).get("/api/race?mode=normal&sortBy=time&sort=DESC");
        
        test.expect(200)
            .end((err, res) =>
            {
                if(err)
                {
                    done(err);
                    return;
                }

                if(res.body.results.length != 10)
                {
                    done(new Error(`expected 10 results but got ${res.body.results.length}`));
                    return;
                }
                
                let out = [];
                res.body.results.forEach((result) => out.push(result.time));
                
                if(!isSortedDescending(out))
                {
                    done(new Error(`expected 10 results ordered by time, in descending order but got ${out.toString()}`));
                    return;
                }

                done();
            })
    });
    
    it("should respond with 5 results when limit is set to 5", (done) =>
    {
        const test = request(app).get("/api/race?mode=normal&limit=5");
        
        test.expect(200)
            .end((err, res) =>
            {
                if(err)
                {
                    done(err);
                    return;
                }

                if(res.body.results.length != 5)
                {
                    done(new Error(`expected 10 results but got ${res.body.results.length}`));
                    return;
                }
                
                done();
            })
    });

    it("should respond with 1 result offset by 0", (done) =>
    {
        request(app).get("/api/race?mode=normal&limit=10&offset=0").end((err, res) =>
        {
            const baselineResults = res.body.results;

            const test = request(app).get("/api/race?mode=normal&limit=1&offset=0");
        
            test.expect(200)
                .end((err, res) =>
                {
                    if(err)
                    {
                        done(err);
                        return;
                    }
    
                    if(res.body.results.length != 1)
                    {
                        done(new Error(`expected 1 result but got ${res.body.results.length}`));
                        return;
                    }

                    if(res.body.results[0].id != baselineResults[0].id)
                    {
                        done(new Error(`expected ${res.body.results[0].id} and ${baselineResults[4].id} to match.`));
                        return;
                    }

                    done();
                })
        });

    });
    
    it("should respond with 1 result offset by 5", (done) =>
    {
        request(app).get("/api/race?mode=normal&limit=10&offset=0").end((err, res) =>
        {
            const baselineResults = res.body.results;

            const test = request(app).get("/api/race?mode=normal&limit=1&offset=5");
        
            test.expect(200)
                .end((err, res) =>
                {
                    if(err)
                    {
                        done(err);
                        return;
                    }
    
                    if(res.body.results.length != 1)
                    {
                        done(new Error(`expected 1 result but got ${res.body.results.length}`));
                        return;
                    }

                    if(res.body.results[0].id != baselineResults[5].id)
                    {
                        done(new Error(`expected ${res.body.results[0].id} and ${baselineResults[5].id} to match.`));
                        return;
                    }

                    done();
                })
        });
    });
}); // GET /race


describe("ENDPOINT /api/pause - cookie not set", () =>
{
    describe("POST /api/pause", () =>
    {
        it("should respond with json", (done) =>
        {
            const test = request(app).post("/api/pause");
            
            test.expect("Content-Type", /json/)
                .end((err, res) =>
                {
                    done(err);
                });
        });
    
        it("should respond with code 401", (done) =>
        {
            const test = request(app).post("/api/pause");
            
            test.expect(401)
                .end((err, res) =>
                {
                    done(err);
                });
        });

        it("should respond with `unauthorized` in body", (done) =>
        {
            const test = request(app).post("/api/pause");
            
            test.expect(/unauthorized/)
                .end((err, res) =>
                {
                    done(err);
                });
        });
    });

    describe("PATCH /api/pause", () =>
    {
        it("should respond with json", (done) =>
        {
            const test = request(app).patch("/api/pause");
            
            test.expect("Content-Type", /json/)
                .end((err, res) =>
                {
                    done(err);
                });
        });
    
        it("should respond with code 401", (done) =>
        {
            const test = request(app).patch("/api/pause");
            
            test.expect(401)
                .end((err, res) =>
                {
                    done(err);
                });
        });

        it("should respond with `unauthorized` in body", (done) =>
        {
            const test = request(app).patch("/api/pause");
            
            test.expect(/unauthorized/)
                .end((err, res) =>
                {
                    done(err);
                });
        });
    });
    
});

describe("ENDPOINT /api/pause - needs to test during a race!", () =>
{

    it("missing parameters - respond with code 400", function(done)
    {
        this.timeout(10000);
        
        const startRace = request(app).post("/api/race");
        startRace.cookies = sessionCookie;
        startRace.expect(/race started/)
            .end((err, res) =>
            {
                const thisRaceId = res.body.raceId;
                
                setTimeout(() =>
                {
                    const test = request(app).post("/api/pause");
                    test.cookies = sessionCookie;
                    
                    test.expect(400)
                        .end((err, res) =>
                        {
                            done(err);
                        });
    
                }, 2000);
            });
    });

    it("with parameters - with non-existing raceID - respond with code 404", function(done)
    {
        this.timeout(10000);
        
        const startRace = request(app).post("/api/race");
        startRace.cookies = sessionCookie;
        startRace.expect(/race started/)
            .end((err, res) =>
            {
                const thisRaceId = res.body.raceId;
                
                setTimeout(() =>
                {
                    const test = request(app).post("/api/pause");
                    test.cookies = sessionCookie;
                    
                    test.send({ raceId: "does-not-exist" })
                        .expect(404)
                        .end((err, res) =>
                        {
                            done(err);
                        });
    
                }, 2000);
            });
    });

    it("with parameters - respond with code 200", function(done)
    {
        this.timeout(10000);
        
        const startRace = request(app).post("/api/race");
        startRace.cookies = sessionCookie;
        startRace.expect(/race started/)
            .end((err, res) =>
            {
                if(err)
                {
                    done(err);
                    return;
                }
                const thisRaceId = res.body.raceId;
                
                setTimeout(() =>
                {
                    const test = request(app).post("/api/pause");
                    test.cookies = sessionCookie;
                    
                    test.send({ raceId: thisRaceId })
                        .expect(200)
                        .end((err, res) =>
                        {
                            done(err);
                        });
    
                }, 2000);
            });
    });

    it("with parameters - unpause with parameters - respond with code 200", function(done)
    {
        this.timeout(10000);
        
        const startRace = request(app).post("/api/race");
        startRace.cookies = sessionCookie;
        startRace.expect(/race started/)
            .end((err, res) =>
            {
                if(err)
                {
                    done(err);
                    return;
                }

                const thisRaceId = res.body.raceId;
                
                setTimeout(() =>
                {
                    const test = request(app).post("/api/pause");
                    test.cookies = sessionCookie;
                    
                    test.send({ raceId: thisRaceId })
                        .expect(200)
                        .end((err, res) =>
                        {
                            if(err)
                            {
                                done(err);
                                return;
                            }
                            
                            setTimeout(() =>
                            {
                                const test = request(app).patch("/api/pause");
                                test.cookies = sessionCookie;
                                
                                test.send({ raceId: thisRaceId })
                                    .expect(200)
                                    .end((err, res) =>
                                    {
                                        done(err);
                                    });
                
                            }, 2000);
                        });
                }, 2000);
            });
    });


    it("Full race!", function(done)
    {
        this.timeout(10000);
        
        let startTime = 0;
        let endTime = 0;
        let pauseStartTime = 0;
        let pauseTotal = 0;

        const startRace = request(app).post("/api/race");
        startRace.cookies = sessionCookie;
        startRace.expect(/race started/)
            .end((err, res) =>
            {
                if(err)
                {
                    done(err);
                    return;
                }

                const thisRaceId = res.body.raceId;
                startTime = Date.now();
                
                setTimeout(() =>
                {
                    const test = request(app).post("/api/pause");
                    test.cookies = sessionCookie;
                    
                    test.send({ raceId: thisRaceId })
                        .expect(200)
                        .end((err, res) =>
                        {
                            if(err)
                            {
                                done(err);
                                return;
                            }
                            
                            pauseStartTime = Date.now();

                            setTimeout(() =>
                            {
                                const unpause = request(app).patch("/api/pause");
                                unpause.cookies = sessionCookie;
                                
                                unpause.send({ raceId: thisRaceId })
                                    .expect(200)
                                    .end((err, res) =>
                                    {
                                        if(err)
                                        {
                                            done(err);
                                            return;
                                        }
   
                                        pauseTotal += (Date.now() - pauseStartTime);
                                        // console.log("PAUSE TOTAL: ", pauseTotal);
                                        
                                        setTimeout(() =>
                                        {
                                            const test = request(app).patch("/api/race");
                                            test.cookies = sessionCookie;
                                            endTime = Date.now();
                                            const raceTotal = (endTime - startTime) - pauseTotal;
                                            
                                            // console.log("RACE TIME:", raceTotal);

                                            test.send({ raceId: thisRaceId, raceTime: raceTotal, raceMode: "normal" })
                                                .expect(/race update/)
                                                .expect(200)
                                                .end((err, res) =>
                                                {
                                                    done(err);
                                                });                                            
                                        }, 2000);
                                    });
                
                            }, 2000);
                        });
                }, 2000);
            });
    });

});