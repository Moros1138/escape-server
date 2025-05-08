import express from 'express';
import { v4 as uuid4 } from 'uuid';

import {
	RegExpMatcher,
	TextCensor,
	englishDataset,
	englishRecommendedTransformers,
} from 'obscenity';

const matcher = new RegExpMatcher({
	...englishDataset.build(),
	...englishRecommendedTransformers,
});

function ExtractMissingParameters(requiredParams, request)
{
    let missing = [];

    requiredParams.forEach((required) =>
    {
        if(!request.body[required])
        {
            missing.push(required);
        }
    });

    return missing;
}

export default function defineApi(app, races)
{
    if(app === undefined)
    {
        throw new Error("express app is required!");
    }

    if(races === undefined)
    {
        throw new Error("races database is required!")
    }
    
    
    app.get("/api/session", (request, response) =>
    {
        if(request.session.userId)
        {
            response
                .set("Content-Type", "application/json")
                .status(200)
                .send({
                    result: "ok",
                    message: "session exists"
                })        
    
            return;
        }
        
        response
            .set("Content-Type", "application/json")
            .status(404)
            .send({
                result: "fail",
                message: "session not found"
            });
    });

    app.post("/api/session", (request, response) =>
    {
        if(request.session.userId)
        {
            response
                .set("Content-Type", "application/json")
                .status(200)
                .send({
                    result: "ok",
                    message: "session exists"
                })        
    
            return;
        }
        
        request.session.userId = uuid4();
        request.session.userName = `Guest_${Math.random().toString(36).substring(7)}`;

        response
            .set("Content-Type", "application/json")
            .status(200)
            .send({
                result: 'ok',
                message: 'session created'
            });
    });
        
    app.delete('/api/session', (request, response) =>
    {
        console.log('Destroying session');
        request.session.destroy(() =>
        {
            response
                .set("Content-Type", "application/json")
                .status(200)
                .send({
                    result: 'ok',
                    message: 'session destroyed'
                });
        });
    });
        
    app.post('/api/name', (request, response) =>
    {
        if(!request.session.userId)
        {
            response
                .set("Content-Type", "application/json")
                .status(401)
                .send({
                    result: 'fail',
                    message: 'unauthorized'
                });
    
            return;
        }

        let missingParameters = ExtractMissingParameters([
            "userName"
        ], request);

        if(missingParameters.length > 0)
        {
            response
                .set("Content-Type", "application/json")
                .status(400)
                .send({
                    result: 'fail',
                    message: `required parameter (${missingParameters.join()}) missing`,
                });
            return;
        }
    
        if(matcher.hasMatch(request.body.userName))
        {
            response
                .set("Content-Type", "application/json")
                .status(406)
                .send({
                    result: 'fail',
                    message: 'the provided name contains profanity',
                });
            
            return;
        }
        
        request.session.userName = request.body.userName;
        
        response
            .set("Content-Type", "application/json")
            .status(200)
            .send({
                result: 'ok',
                message: 'name is set',
            });
    
    });
    
    app.get('/api/counters', (request, response) =>
    {
        if(!request.session.userId)
        {
            response
                .set("Content-Type", "application/json")
                .status(401)
                .send({
                    result: 'fail',
                    message: 'unauthorized'
                });
    
            return;
        }

        let results = null;
        try
        {
            const stmt = races.prepare(`SELECT * FROM counters;`);
            results = stmt.all();
        }
        catch(e)
        {
            response.status(200)
                .set("Content-Type", "application/json")
                .send({
                    result: "fail",
                    params: params,
                    message: "server error. contact admin"
                });

            return;
        }

        response.status(200)
            .set("Content-Type", "application/json")
            .send({
                result: "ok",
                params: request.params,
                results: results
            });

    
    });

    app.get('/api/counters/:mode', (request, response) =>
    {
        if(!request.session.userId)
        {
            response
                .set("Content-Type", "application/json")
                .status(401)
                .send({
                    result: 'fail',
                    message: 'unauthorized'
                });
    
            return;
        }

        let results = null;
        try
        {
            const stmt = races.prepare(`
                SELECT * FROM counters
                WHERE mode = ?;
            `);
            
            results = stmt.get(request.params.mode);
        }
        catch(e)
        {
            response.status(200)
                .set("Content-Type", "application/json")
                .send({
                    result: "fail",
                    params: params,
                    message: "server error. contact admin"
                });

            return;
        }

        response.status(200)
            .set("Content-Type", "application/json")
            .send({
                result: "ok",
                params: request.params,
                count: results.count
            });
        
    });

    app.post('/api/counters/:mode', (request, response) =>
    {
        if(!request.session.userId)
        {
            response
                .set("Content-Type", "application/json")
                .status(401)
                .send({
                    result: 'fail',
                    message: 'unauthorized'
                });
    
            return;
        }

        try
        {
            const stmt = races.prepare(`
                UPDATE counters SET count = count + 1 WHERE mode = ?;
            `);
            
            stmt.run(request.params.mode);
        }
        catch(e)
        {
            response.status(404)
                .set("Content-Type", "application/json")
                .send({
                    result: "fail",
                    params: request.params,
                    message: "server error. contact admin",
                });

            return;
        }
        
        let results = null;
        try
        {
            const stmt = races.prepare(`
                SELECT * FROM counters
                WHERE mode = ?;
            `);
            
            results = stmt.get(request.params.mode);
        }
        catch(e)
        {
            response.status(200)
                .set("Content-Type", "application/json")
                .send({
                    result: "fail",
                    params: request.params,
                    message: "server error. contact admin"
                });

            return;
        }

        response.status(200)
            .set("Content-Type", "application/json")
            .send({
                result: "ok",
                params: request.params,
                count: results.count
            });
    });
    
    app.get('/api/race', (request, response) =>
    {
        const params = {
            sort: "ASC",
            mode: "",
            offset: 0,
            limit: 10,
            sortBy: "id"
        };
        
        if(request.query.sort)
        {
            if(request.query.sort.toLowerCase() == "asc")
            {
                params.sort = "ASC";
            }
            
            if(request.query.sort.toLowerCase() == "desc")
            {
                params.sort = "DESC";
            }
        }

        if(request.query.mode)
        {
            params.mode = request.query.mode;
        }

        if(request.query.offset)
        {
            params.offset = parseInt(request.query.offset);
        }

        if(request.query.limit)
        {
            params.limit = parseInt(request.query.limit);
        }

        if(request.query.sortBy)
        {
            if(['id', 'mode', 'time', 'created_at'].indexOf(request.query.sortBy) !== -1)
            {
                params.sortBy = request.query.sortBy;
            }
        }

        let results = null;
        try
        {
            const stmt = races.prepare(`
                SELECT * FROM races
                WHERE mode = ?
                ORDER BY ${params.sortBy} ${params.sort}
                LIMIT ? OFFSET ?;
            `);
        
            results = stmt.all(params.mode, params.limit, params.offset);

        }
        catch(e)
        {
            response.status(200)
            .set("Content-Type", "application/json")
            .send({
                result: "fail",
                params: params,
                message: "server error. contact admin"
            });

            return;
        }

        response.status(200)
            .set("Content-Type", "application/json")
            .send({
                result: "ok",
                params: params,
                results: results
            });
    });

    app.post('/api/race', (request, response) =>
    {
        if(!request.session.userId)
        {
            response
                .set("Content-Type", "application/json")
                .status(401)
                .send({
                    result: 'fail',
                    message: 'unauthorized'
                });
    
            return;
        }
        
        request.session.raceId = uuid4();
        request.session.raceStartTime = Date.now();
        request.session.raceEndTime = 0;

        request.session.racePauseTimeStart = 0;
        request.session.racePauseTimeTotal = 0;

        response
            .set("Content-Type", "application/json")
            .status(200)
            .send({
                result: "ok",
                message: "race started",
                raceId: request.session.raceId,
            });
    });

    app.post("/api/pause", (request, response) =>
    {
        if(!request.session.userId)
        {
            response.status(401)
                .set("Content-Type", "application/json")
                .send({
                    result: 'fail',
                    message: 'unauthorized'
                });
    
            return;
        }

        let missingParameters = ExtractMissingParameters([
            "raceId",
        ], request);

        if(missingParameters.length > 0)
        {
            response.status(400)
                    .set("Content-Type", "application/json")
                    .send({
                        result: "fail",
                        message: `required parameter (${missingParameters.join()}) missing`,
                    });

            return;
        }
        
        if(request.session.raceId != request.body.raceId)
        {
            response.status(404)
                    .set("Content-Type", "application/json")
                    .send({
                        result: "fail",
                        message: "raceId not found"
                    });
            
            return;
        }
        
        if(request.session.racePauseTimeStart !== 0)
        {
            response.status(400)
                    .set("Content-Type", "application/json")
                    .send({
                        result: "fail",
                        message: "race already paused"
                    });
            
            return;
        }
        
        request.session.racePauseTimeStart = Date.now();

        response.status(200)
            .set("Content-Type", "application/json")
            .send({
                result: "ok",
                message: "race paused"
            });

    });

    app.patch("/api/pause", (request, response) =>
        {
            if(!request.session.userId)
            {
                response.status(401)
                    .set("Content-Type", "application/json")
                    .send({
                        result: 'fail',
                        message: 'unauthorized'
                    });
        
                return;
            }
    
            let missingParameters = ExtractMissingParameters([
                "raceId",
            ], request);
    
            if(missingParameters.length > 0)
            {
                response.status(400)
                        .set("Content-Type", "application/json")
                        .send({
                            result: "fail",
                            message: `required parameter (${missingParameters.join()}) missing`,
                        });
    
                return;
            }
            
            if(request.session.raceId != request.body.raceId)
            {
                response.status(404)
                        .set("Content-Type", "application/json")
                        .send({
                            result: "fail",
                            message: "raceId not found"
                        });
                
                return;
            }
            
            if(request.session.racePauseTimeStart === 0)
            {
                response.status(400)
                        .set("Content-Type", "application/json")
                        .send({
                            result: "fail",
                            message: "race not paused"
                        });
                
                return;
            }
            
            request.session.racePauseTimeTotal += (Date.now() - request.session.racePauseTimeStart);
            request.session.racePauseTimeStart = 0;

            response.status(200)
                .set("Content-Type", "application/json")
                .send({
                    result: "ok",
                    message: "race unpaused"
                });
    
        });
    


    app.patch("/api/race", (request, response) =>
    {
        if(!request.session.userId)
        {
            response.status(401)
                .set("Content-Type", "application/json")
                .send({
                    result: 'fail',
                    message: 'unauthorized'
                });
    
            return;
        }
        
        let missingParameters = ExtractMissingParameters([
            "raceId",
            "raceTime",
            "raceMode",
        ], request);

        if(missingParameters.length > 0)
        {
            response.status(400)
                    .set("Content-Type", "application/json")
                    .send({
                        result: "fail",
                        message: `required parameter (${missingParameters.join()}) missing`,
                    });

            return;
        }
        
        if(request.session.raceId != request.body.raceId)
        {
            response.status(404)
                    .set("Content-Type", "application/json")
                    .send({
                        result: "fail",
                        message: "raceId not found"
                    });
            
            return;
        }

        // race time reported by the client
        const clientTime = parseInt(request.body.raceTime);
        
        // end time
        request.session.raceEndTime = Date.now();
        
        // race time calculated by the server 
        const serverTime = (request.session.raceEndTime - request.session.raceStartTime) - request.session.racePauseTimeTotal;
        
        // difference between client and server race time reporting
        const difference = Math.abs(serverTime - clientTime);
        
        // one way or another, this race is over!
        request.session.raceStartTime = -1;
        request.session.raceEndTime = -1;
        request.session.racePauseTimeStart = 0;
        request.session.racePauseTimeTotal = 0;

        request.session.raceId = null;

        // if the absolute difference is greater than 1s, fail
        if(difference > 1000)
        {
            response.status(400)
                .set("Content-Type", "application/json")
                .send({
                    result: "fail",
                    message: "raceTime mismatch",
                    serverTime: serverTime,
                    clientTime: clientTime,
                    difference: difference
                });
            
            return;
        }

        try
        {
            const insertRace = races.prepare("INSERT INTO `races` (`name`, `mode`, `time`) VALUES (@name, @mode, @time);");
        
            insertRace.run({
                name: request.session.userName,
                mode: request.body.raceMode,
                time: request.body.raceTime,
            });
        }
        catch(e)
        {
            response.status(500)
                .set("Content-Type", "application/json")
                .send({
                    result: "fail",
                    message: "server error. contact admin",
                });
            
            return;
        }
        
        response.status(200)
            .set("Content-Type", "application/json")
            .send({
                result: "ok",
                message: "race updated"
            });
    });

    app.delete('/api/race', (request, response) =>
    {
        if(!request.session.userId)
        {
            response.status(401)
                .set("Content-Type", "application/json")
                .send({
                    result: 'fail',
                    message: 'unauthorized'
                });
    
            return;
        }
        
        let missingParameters = ExtractMissingParameters([
            "raceId",
        ], request);

        if(missingParameters.length > 0)
        {
            response.status(400)
                    .set("Content-Type", "application/json")
                    .send({
                        result: "fail",
                        message: `required parameter (${missingParameters.join()}) missing`,
                    });

            return;
        }

        if(request.session.raceId != request.body.raceId)
        {
            response.status(404)
                    .set("Content-Type", "application/json")
                    .send({
                        result: "fail",
                        message: "raceId not found"
                    });
            
            return;
        }

        request.session.raceId = null;
        request.session.raceEndTime = 0;
        request.session.raceStartTime = 0;

        response.status(200)
            .set("Content-Type", "application/json")
            .send({
                result: "ok",
                message: "race interrupted"
            });
    });

}



